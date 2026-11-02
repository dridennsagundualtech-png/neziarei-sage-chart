package app.sinnerscure.bible;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(NaturalVoicePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
