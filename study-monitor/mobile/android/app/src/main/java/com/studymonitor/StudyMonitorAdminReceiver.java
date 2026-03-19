// android/app/src/main/java/com/studymonitor/StudyMonitorAdminReceiver.java
package com.studymonitor;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

public class StudyMonitorAdminReceiver extends DeviceAdminReceiver {
    @Override
    public void onEnabled(Context c, Intent i) {
        Toast.makeText(c, "Study Monitor: Admin access granted ✓", Toast.LENGTH_SHORT).show();
    }
    @Override
    public void onDisabled(Context c, Intent i) {
        Toast.makeText(c, "Study Monitor: Admin access removed", Toast.LENGTH_SHORT).show();
    }
    @Override
    public CharSequence onDisableRequested(Context c, Intent i) {
        return "Removing admin access will stop app restrictions from working. Are you sure?";
    }
}
