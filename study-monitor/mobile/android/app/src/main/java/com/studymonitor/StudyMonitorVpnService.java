// android/app/src/main/java/com/studymonitor/StudyMonitorVpnService.java
package com.studymonitor;

import android.net.VpnService;
import android.os.ParcelFileDescriptor;
import android.content.Intent;
import android.util.Log;

import java.io.*;
import java.net.InetAddress;
import java.nio.ByteBuffer;
import java.util.*;

public class StudyMonitorVpnService extends VpnService {
    private static final String TAG = "StudyMonitorVPN";
    public static boolean isRunning = false;
    private ParcelFileDescriptor vpnInterface;
    private Thread vpnThread;
    private static final Set<String> BLOCKED = new HashSet<>(DeviceControlModule.BETTING_DOMAINS);

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if ("STOP".equals(intent != null ? intent.getAction() : null)) {
            stopVpn(); return START_NOT_STICKY;
        }
        startVpn();
        return START_STICKY;
    }

    private void startVpn() {
        try {
            Builder b = new Builder();
            b.setSession("Study Monitor Blocker");
            b.addAddress("10.0.0.2", 32);
            b.addRoute("0.0.0.0", 0);
            b.addDnsServer("8.8.8.8");
            vpnInterface = b.establish();
            isRunning = true;
            vpnThread = new Thread(this::runLoop, "VpnLoop");
            vpnThread.start();
            Log.i(TAG, "VPN started — betting sites blocked");
        } catch (Exception e) {
            Log.e(TAG, "VPN failed: " + e.getMessage());
            isRunning = false;
        }
    }

    private void runLoop() {
        FileInputStream in = new FileInputStream(vpnInterface.getFileDescriptor());
        FileOutputStream out = new FileOutputStream(vpnInterface.getFileDescriptor());
        byte[] buf = new byte[32767];
        while (isRunning && !Thread.interrupted()) {
            try {
                int len = in.read(buf);
                if (len <= 0) { Thread.sleep(10); continue; }
                byte[] pkt = Arrays.copyOf(buf, len);
                if (isDns(pkt)) {
                    String domain = extractDomain(pkt);
                    if (domain != null && isBlocked(domain)) {
                        byte[] nx = makeNxDomain(pkt);
                        if (nx != null) { out.write(nx); continue; }
                    }
                }
                // Non-DNS or non-blocked: pass through
            } catch (InterruptedException e) { break; }
            catch (Exception e) { Log.e(TAG, e.getMessage()); }
        }
    }

    private boolean isDns(byte[] p) {
        if (p.length < 28) return false;
        if ((p[0] >> 4 & 0xF) != 4) return false;
        if ((p[9] & 0xFF) != 17) return false;
        int ihl = (p[0] & 0xF) * 4;
        int dst = ((p[ihl+2] & 0xFF) << 8) | (p[ihl+3] & 0xFF);
        return dst == 53;
    }

    private String extractDomain(byte[] p) {
        try {
            int ihl = (p[0] & 0xF) * 4;
            int start = ihl + 8 + 12;
            StringBuilder sb = new StringBuilder();
            int i = start;
            while (i < p.length) {
                int l = p[i] & 0xFF;
                if (l == 0) break;
                if (sb.length() > 0) sb.append('.');
                i++;
                for (int j = 0; j < l && i < p.length; j++, i++) sb.append((char) p[i]);
            }
            return sb.toString().toLowerCase();
        } catch (Exception e) { return null; }
    }

    private boolean isBlocked(String d) {
        for (String b : BLOCKED) if (d.equals(b) || d.endsWith("." + b)) return true;
        return false;
    }

    private byte[] makeNxDomain(byte[] q) {
        try {
            int ihl = (q[0] & 0xF) * 4;
            byte[] dns = Arrays.copyOfRange(q, ihl + 8, q.length);
            dns[2] = (byte) 0x81; dns[3] = (byte) 0x83;
            byte[] udp = new byte[8 + dns.length];
            udp[0]=q[ihl+2]; udp[1]=q[ihl+3]; udp[2]=q[ihl]; udp[3]=q[ihl+1];
            int ul = 8 + dns.length; udp[4]=(byte)(ul>>8); udp[5]=(byte)(ul&0xFF);
            System.arraycopy(dns, 0, udp, 8, dns.length);
            byte[] ip = new byte[ihl + udp.length];
            System.arraycopy(q, 0, ip, 0, ihl);
            System.arraycopy(q, 16, ip, 12, 4); System.arraycopy(q, 12, ip, 16, 4);
            int tl = ihl + udp.length; ip[2]=(byte)(tl>>8); ip[3]=(byte)(tl&0xFF);
            System.arraycopy(udp, 0, ip, ihl, udp.length);
            return ip;
        } catch (Exception e) { return null; }
    }

    private void stopVpn() {
        isRunning = false;
        if (vpnThread != null) vpnThread.interrupt();
        try { if (vpnInterface != null) vpnInterface.close(); } catch (Exception ignored) {}
        stopSelf();
    }

    @Override public void onDestroy() { stopVpn(); super.onDestroy(); }
}
