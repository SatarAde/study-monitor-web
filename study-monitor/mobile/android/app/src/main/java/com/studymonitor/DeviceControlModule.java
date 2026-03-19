// android/app/src/main/java/com/studymonitor/DeviceControlModule.java
package com.studymonitor;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.VpnService;
import android.os.Build;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;

import java.util.Arrays;
import java.util.List;

public class DeviceControlModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "DeviceControl";

    // Apps blocked when student fails a test
    private static final List<String> SOCIAL_MEDIA_APPS = Arrays.asList(
        "com.instagram.android",
        "com.twitter.android",
        "com.facebook.katana",
        "com.facebook.orca",
        "com.snapchat.android",
        "com.zhiliaoapp.musically",
        "com.tiktok.android",
        "com.google.android.youtube"
    );

    private static final List<String> GAME_APPS = Arrays.asList(
        "com.supercell.clashofclans",
        "com.supercell.clashroyale",
        "com.mojang.minecraftpe",
        "com.king.candycrushsaga",
        "com.ea.games.r3_row",
        "com.gameloft.android.ANMP.GloftA9HM",
        "com.activision.callofduty.shooter"
    );

    // Nigerian + international betting sites to block via VPN
    public static final List<String> BETTING_DOMAINS = Arrays.asList(
        "bet9ja.com", "www.bet9ja.com", "mobile.bet9ja.com",
        "sportybet.com", "www.sportybet.com",
        "nairabet.com", "www.nairabet.com",
        "merrybet.com", "www.merrybet.com",
        "1xbet.com", "www.1xbet.com", "1xbet.ng",
        "betway.com", "www.betway.com", "betway.com.ng",
        "betking.com", "www.betking.com",
        "bangbet.com", "www.bangbet.com",
        "accessbet.com", "www.accessbet.com",
        "paripesa.com", "www.paripesa.com",
        "betwinner.com", "www.betwinner.com",
        "22bet.com", "www.22bet.com",
        "melbet.com", "www.melbet.com",
        "msport.com", "www.msport.com",
        "cloudbet.com", "betano.com",
        "sportnation.bet", "betfair.com"
    );

    private DevicePolicyManager dpm;
    private ComponentName adminComponent;
    private ReactApplicationContext reactContext;

    public DeviceControlModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        this.adminComponent = new ComponentName(context, StudyMonitorAdminReceiver.class);
    }

    @Override
    public String getName() { return MODULE_NAME; }

    @ReactMethod
    public void isDeviceAdmin(Promise promise) {
        promise.resolve(dpm.isAdminActive(adminComponent));
    }

    @ReactMethod
    public void requestDeviceAdmin(Promise promise) {
        Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
        intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent);
        intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION,
            "Study Monitor needs device admin access to hide distracting apps when you fail a test. Apps are restored when you pass.");
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(intent);
        promise.resolve(true);
    }

    @ReactMethod
    public void blockAppsOnFail(Promise promise) {
        if (!dpm.isAdminActive(adminComponent)) {
            promise.reject("NOT_ADMIN", "Device admin not granted");
            return;
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                for (String pkg : SOCIAL_MEDIA_APPS) {
                    try { dpm.setApplicationHidden(adminComponent, pkg, true); }
                    catch (Exception ignored) {}
                }
                for (String pkg : GAME_APPS) {
                    try { dpm.setApplicationHidden(adminComponent, pkg, true); }
                    catch (Exception ignored) {}
                }
            }
            promise.resolve(true);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void unblockAppsOnPass(Promise promise) {
        if (!dpm.isAdminActive(adminComponent)) {
            promise.reject("NOT_ADMIN", "Device admin not granted");
            return;
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                for (String pkg : SOCIAL_MEDIA_APPS) {
                    try { dpm.setApplicationHidden(adminComponent, pkg, false); }
                    catch (Exception ignored) {}
                }
                for (String pkg : GAME_APPS) {
                    try { dpm.setApplicationHidden(adminComponent, pkg, false); }
                    catch (Exception ignored) {}
                }
            }
            promise.resolve(true);
        } catch (Exception e) { promise.reject("ERROR", e.getMessage()); }
    }

    @ReactMethod
    public void startBettingBlocker(Promise promise) {
        Intent prepare = VpnService.prepare(reactContext);
        if (prepare != null) {
            promise.reject("VPN_PERMISSION_NEEDED", "User must approve VPN");
            return;
        }
        Intent svc = new Intent(reactContext, StudyMonitorVpnService.class);
        svc.setAction("START");
        reactContext.startService(svc);
        promise.resolve(true);
    }

    @ReactMethod
    public void stopBettingBlocker(Promise promise) {
        Intent svc = new Intent(reactContext, StudyMonitorVpnService.class);
        svc.setAction("STOP");
        reactContext.startService(svc);
        promise.resolve(true);
    }

    @ReactMethod
    public void isBettingBlockerActive(Promise promise) {
        promise.resolve(StudyMonitorVpnService.isRunning);
    }

    @ReactMethod
    public void getBlockableAppsInstalled(Promise promise) {
        PackageManager pm = reactContext.getPackageManager();
        WritableArray result = Arguments.createArray();
        List<String> all = new java.util.ArrayList<>();
        all.addAll(SOCIAL_MEDIA_APPS);
        all.addAll(GAME_APPS);
        for (String pkg : all) {
            try { pm.getPackageInfo(pkg, 0); result.pushString(pkg); }
            catch (PackageManager.NameNotFoundException ignored) {}
        }
        promise.resolve(result);
    }
}
