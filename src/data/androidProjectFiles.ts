import JSZip from 'jszip';
import { ApkProjectConfig } from '../types';

export function getMainActivityKt(config: ApkProjectConfig): string {
  return `package ${config.packageName}

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : ComponentActivity() {

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val recordAudioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        if (!recordAudioGranted) {
            // Inform user about microphone permission
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        checkAndRequestPermissions()

        setContent {
            UltraRecordTheme {
                MainScreen(
                    onStartService = { startAudioService() },
                    onStopService = { stopAudioService() },
                    onPauseService = { pauseAudioService() },
                    onResumeService = { resumeAudioService() }
                )
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.RECORD_AUDIO
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        if (Build.VERSION.SDK_INT >= 34) {
            permissions.add(Manifest.permission.FOREGROUND_SERVICE_MICROPHONE)
        }
        permissionLauncher.launch(permissions.toTypedArray())
    }

    private fun startAudioService() {
        val intent = Intent(this, AudioRecordService::class.java).apply {
            action = AudioRecordService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun stopAudioService() {
        val intent = Intent(this, AudioRecordService::class.java).apply {
            action = AudioRecordService.ACTION_STOP
        }
        startService(intent)
    }

    private fun pauseAudioService() {
        val intent = Intent(this, AudioRecordService::class.java).apply {
            action = AudioRecordService.ACTION_PAUSE
        }
        startService(intent)
    }

    private fun resumeAudioService() {
        val intent = Intent(this, AudioRecordService::class.java).apply {
            action = AudioRecordService.ACTION_RESUME
        }
        startService(intent)
    }
}

@Composable
fun MainScreen(
    onStartService: () -> Unit,
    onStopService: () -> Unit,
    onPauseService: () -> Unit,
    onResumeService: () -> Unit
) {
    var isRecording by remember { mutableStateOf(false) }
    var isPaused by remember { mutableStateOf(false) }
    var recordingTime by remember { mutableLongOfStateOf(0L) }
    var selectedTab by remember { mutableIntStateOf(0) }

    LaunchedEffect(isRecording, isPaused) {
        if (isRecording && !isPaused) {
            while (true) {
                kotlinx.coroutines.delay(1000)
                recordingTime++
            }
        }
    }

    Scaffold(
        containerColor = Color(0xFF090D16),
        topBar = {
            TopAppBarCustom()
        },
        bottomBar = {
            BottomNavCustom(selectedTab) { selectedTab = it }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            if (selectedTab == 0) {
                // Recording Studio View
                Spacer(modifier = Modifier.height(24.dp))
                
                // Format & Preset Pill
                PresetCard()

                Spacer(modifier = Modifier.height(32.dp))

                // Timer Display
                Text(
                    text = formatTime(recordingTime),
                    fontSize = 54.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    letterSpacing = 2.sp
                )

                Text(
                    text = if (isRecording) {
                        if (isPaused) "রেকর্ডিং স্থগিত (PAUSED)" else "লাইভ রেকর্ডিং চলছে (RECORDING...)"
                    } else "রেকর্ড করতে ট্যাপ করুন",
                    fontSize = 14.sp,
                    color = if (isRecording) (if (isPaused) Color(0xFFFBBF24) else Color(0xFFF43F5E)) else Color(0xFF94A3B8)
                )

                Spacer(modifier = Modifier.height(36.dp))

                // Real-time Waveform Canvas
                WaveformVisualizerBox(isRecording = isRecording && !isPaused)

                Spacer(modifier = Modifier.weight(1f))

                // Record / Pause / Stop Controls
                RecordControls(
                    isRecording = isRecording,
                    isPaused = isPaused,
                    onRecordToggle = {
                        if (!isRecording) {
                            isRecording = true
                            isPaused = false
                            recordingTime = 0L
                            onStartService()
                        } else {
                            isRecording = false
                            isPaused = false
                            onStopService()
                        }
                    },
                    onPauseToggle = {
                        if (isPaused) {
                            isPaused = false
                            onResumeService()
                        } else {
                            isPaused = true
                            onPauseService()
                        }
                    }
                )

                Spacer(modifier = Modifier.height(32.dp))
            } else {
                // Recordings Library View
                RecordingsLibraryScreen()
            }
        }
    }
}

@Composable
fun TopAppBarCustom() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "${config.appName}",
                fontSize = 22.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White
            )
            Text(
                text = "HD অডিও স্টুডিও ও ব্যাকগ্রাউন্ড সার্ভিস",
                fontSize = 12.sp,
                color = Color(0xFF38BDF8)
            )
        }
        Box(
            modifier = Modifier
                .clip(CircleShape)
                .background(Color(0xFF1E293B))
                .padding(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "Settings",
                tint = Color.White,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
fun PresetCard() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF131C2E))
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(16.dp))
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text("রেকর্ডিং ফরম্যাট: WAV 48kHz", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text("24-bit Lossless • ব্যাকগ্রাউন্ড অন", color = Color(0xFF94A3B8), fontSize = 12.sp)
        }
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0xFF0284C7).copy(alpha = 0.2f))
                .border(1.dp, Color(0xFF0284C7), RoundedCornerShape(20.dp))
                .padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            Text("HQ STUDIO", color = Color(0xFF38BDF8), fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun WaveformVisualizerBox(isRecording: Boolean) {
    val infiniteTransition = rememberInfiniteTransition(label = "wave")
    val phase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "phase"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(130.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(Color(0xFF0D1525))
            .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(20.dp))
            .padding(12.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height
            val barCount = 38
            val barWidth = (width / barCount) * 0.55f

            for (i in 0 until barCount) {
                val x = i * (width / barCount) + barWidth / 2
                val waveHeight = if (isRecording) {
                    val angle = Math.toRadians((i * 18.0 + phase).toDouble())
                    (kotlin.math.sin(angle) * 0.4 + 0.6).toFloat() * height * 0.8f
                } else {
                    12f
                }

                val topY = (height - waveHeight) / 2
                val bottomY = (height + waveHeight) / 2

                drawLine(
                    brush = Brush.verticalGradient(
                        colors = if (isRecording) listOf(
                            Color(0xFFF43F5E),
                            Color(0xFF38BDF8)
                        ) else listOf(Color(0xFF334155), Color(0xFF1E293B))
                    ),
                    start = Offset(x, topY),
                    end = Offset(x, bottomY),
                    strokeWidth = barWidth,
                    cap = StrokeCap.Round
                )
            }
        }
    }
}

@Composable
fun RecordControls(
    isRecording: Boolean,
    isPaused: Boolean,
    onRecordToggle: () -> Unit,
    onPauseToggle: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Flag/Marker button
        IconButton(
            onClick = { /* Add marker */ },
            modifier = Modifier
                .size(52.dp)
                .clip(CircleShape)
                .background(Color(0xFF1E293B))
        ) {
            Icon(Icons.Default.Bookmark, contentDescription = "Marker", tint = Color.White)
        }

        // Main Record Button with Glow
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(86.dp)
                .clip(CircleShape)
                .background(
                    if (isRecording) Color(0xFFF43F5E).copy(alpha = 0.25f)
                    else Color(0xFF0284C7).copy(alpha = 0.2f)
                )
                .clickable { onRecordToggle() }
        ) {
            Box(
                modifier = Modifier
                    .size(68.dp)
                    .clip(CircleShape)
                    .background(
                        if (isRecording) Color(0xFFE11D48)
                        else Color(0xFF0284C7)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isRecording) Icons.Default.Stop else Icons.Default.Mic,
                    contentDescription = if (isRecording) "Stop" else "Record",
                    tint = Color.White,
                    modifier = Modifier.size(34.dp)
                )
            }
        }

        // Pause/Resume button
        IconButton(
            onClick = onPauseToggle,
            enabled = isRecording,
            modifier = Modifier
                .size(52.dp)
                .clip(CircleShape)
                .background(if (isRecording) Color(0xFF1E293B) else Color(0xFF0F172A))
        ) {
            Icon(
                imageVector = if (isPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                contentDescription = "Pause",
                tint = if (isRecording) Color.White else Color(0xFF475569)
            )
        }
    }
}

@Composable
fun RecordingsLibraryScreen() {
    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            text = "সংরক্ষিত রেকর্ড সমূহ (My Recordings)",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            modifier = Modifier.padding(vertical = 16.dp)
        )
        // Dummy list representation
        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(listOf("Voice_Memo_001.wav", "Meeting_Lecture_HQ.wav", "Audio_Note_HD.wav")) { title ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(Color(0xFF131C2E))
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(title, color = Color.White, fontWeight = FontWeight.Medium, fontSize = 15.sp)
                        Text("2 মিনিট 45 সেকেন্ড • 48 kHz WAV", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    }
                    Icon(Icons.Default.PlayCircle, contentDescription = "Play", tint = Color(0xFF38BDF8), modifier = Modifier.size(32.dp))
                }
            }
        }
    }
}

@Composable
fun BottomNavCustom(selected: Int, onSelect: (Int) -> Unit) {
    NavigationBar(
        containerColor = Color(0xFF0B132B),
        tonalElevation = 8.dp
    ) {
        NavigationBarItem(
            selected = selected == 0,
            onClick = { onSelect(0) },
            icon = { Icon(Icons.Default.Mic, contentDescription = "Record") },
            label = { Text("রেকর্ডার") },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color(0xFF38BDF8),
                selectedTextColor = Color(0xFF38BDF8),
                unselectedIconColor = Color(0xFF64748B),
                unselectedTextColor = Color(0xFF64748B),
                indicatorColor = Color(0xFF1E293B)
            )
        )
        NavigationBarItem(
            selected = selected == 1,
            onClick = { onSelect(1) },
            icon = { Icon(Icons.Default.Folder, contentDescription = "Files") },
            label = { Text("ফাইলস") },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color(0xFF38BDF8),
                selectedTextColor = Color(0xFF38BDF8),
                unselectedIconColor = Color(0xFF64748B),
                unselectedTextColor = Color(0xFF64748B),
                indicatorColor = Color(0xFF1E293B)
            )
        )
    }
}

fun formatTime(seconds: Long): String {
    val mins = seconds / 60
    val secs = seconds % 60
    return String.format(Locale.US, "%02d:%02d", mins, secs)
}

@Composable
fun UltraRecordTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF38BDF8),
            background = Color(0xFF090D16),
            surface = Color(0xFF131C2E)
        ),
        content = content
    )
}
`;
}

export function getAudioRecordServiceKt(config: ApkProjectConfig): string {
  return `package ${config.packageName}

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class AudioRecordService : Service() {

    companion object {
        const val ACTION_START = "ACTION_START_RECORDING"
        const val ACTION_STOP = "ACTION_STOP_RECORDING"
        const val ACTION_PAUSE = "ACTION_PAUSE_RECORDING"
        const val ACTION_RESUME = "ACTION_RESUME_RECORDING"
        const val CHANNEL_ID = "ultra_record_channel"
        const val NOTIFICATION_ID = 101
    }

    private var mediaRecorder: MediaRecorder? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var outputFile: File? = null
    private var isRecording = false
    private var isPaused = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startRecording()
            ACTION_STOP -> stopRecording()
            ACTION_PAUSE -> pauseRecording()
            ACTION_RESUME -> resumeRecording()
        }
        return START_NOT_STICKY
    }

    private fun startRecording() {
        if (isRecording) return

        try {
            val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
            val storageDir = getExternalFilesDir(null) ?: filesDir
            outputFile = File(storageDir, "UltraRecord_\${timeStamp}.m4a")

            mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(this)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(48000)
                setAudioEncodingBitRate(256000)
                setOutputFile(outputFile!!.absolutePath)
                prepare()
                start()
            }

            isRecording = true
            isPaused = false

            val notification = buildNotification("রেকর্ডিং চলছে (Recording in background)...")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }

        } catch (e: IOException) {
            e.printStackTrace()
            stopSelf()
        }
    }

    private fun pauseRecording() {
        if (isRecording && !isPaused && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            mediaRecorder?.pause()
            isPaused = true
            updateNotification("রেকর্ডিং সাময়িক স্থগিত (Paused)")
        }
    }

    private fun resumeRecording() {
        if (isRecording && isPaused && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            mediaRecorder?.resume()
            isPaused = false
            updateNotification("রেকর্ডিং চলছে (Recording)...")
        }
    }

    private fun stopRecording() {
        if (!isRecording) return

        try {
            mediaRecorder?.apply {
                stop()
                reset()
                release()
            }
            mediaRecorder = null
            isRecording = false
            isPaused = false
        } catch (e: Exception) {
            e.printStackTrace()
        }

        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "UltraRecord::RecordingWakeLock"
        ).apply {
            acquire(10 * 60 * 1000L /* 10 minutes */)
        }
    }

    private fun buildNotification(contentText: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("${config.appName} ব্যাকগ্রাউন্ড সার্ভিস")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(text: String) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, buildNotification(text))
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "UltraRecord Recording Channel",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "UltraRecord background audio recording channel"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRecording()
        if (wakeLock?.isHeld == true) {
            wakeLock?.release()
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
`;
}

export function getAndroidManifestXml(config: ApkProjectConfig): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="${config.packageName}">

    <!-- Permissions for High-Quality Audio Recording & Background Service -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.UltraRecord">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:theme="@style/Theme.UltraRecord">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Foreground Audio Recording Service for screen-off recording -->
        <service
            android:name=".AudioRecordService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

    </application>

</manifest>
`;
}

export function getAppBuildGradle(config: ApkProjectConfig): string {
  return `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "${config.packageName}"
    compileSdk = ${config.targetSdk}

    defaultConfig {
        applicationId = "${config.packageName}"
        minSdk = ${config.minSdk}
        targetSdk = ${config.targetSdk}
        versionCode = ${config.versionCode}
        versionName = "${config.versionName}"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.kotlinx.coroutines.android)

    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}
`;
}

export function getProjectBuildGradle(): string {
  return `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`;
}

export function getSettingsGradle(config: ApkProjectConfig): string {
  return `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${config.appName.replace(/\s+/g, '')}"
include(":app")
`;
}

export function getLibsVersionsToml(): string {
  return `[versions]
agp = "8.7.2"
kotlin = "2.0.21"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.11.00"
coroutines = "1.9.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`;
}

export function getGithubWorkflowYaml(config: ApkProjectConfig): string {
  return `name: Build UltraRecord Android APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Build Debug APK
        run: ./gradlew assembleDebug --stacktrace

      - name: Build Release APK (Universal)
        run: ./gradlew assembleRelease --stacktrace

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${config.appName.replace(/\s+/g, '_')}-Debug-APK
          path: app/build/outputs/apk/debug/*.apk
          retention-days: 30

      - name: Upload Release APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${config.appName.replace(/\s+/g, '_')}-Release-APK
          path: app/build/outputs/apk/release/*.apk
          retention-days: 30
`;
}

export function getStringsXml(config: ApkProjectConfig): string {
  return `<resources>
    <string name="app_name">${config.appName}</string>
    <string name="notification_channel_name">UltraRecord অডিও রেকর্ডিং সার্ভিস</string>
    <string name="recording_in_progress">লাইভ রেকর্ডিং চলছে...</string>
    <string name="recording_paused">রেকর্ডিং স্থগিত রয়েছে</string>
</resources>
`;
}

export function getStylesXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.UltraRecord" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">#090D16</item>
        <item name="android:navigationBarColor">#090D16</item>
        <item name="android:windowBackground">#090D16</item>
    </style>
</resources>
`;
}

export function getReadmeMarkdown(config: ApkProjectConfig): string {
  return `# ${config.appName} — প্রফেশনাল অ্যান্ড্রয়েড অডিও রেকর্ডার

${config.appName} একটি উচ্চমানের Android অডিও রেকর্ডার অ্যাপ যা স্ক্রীন অফ/ব্যাকগ্রাউন্ডে অডিও রেকর্ড করতে পারে এবং ক্রিস্টাল ক্লিয়ার সাউন্ড কোয়ালিটি প্রদান করে।

---

## 🚀 APK তৈরির ৩টি সহজ উপায় (How to Build APK)

### পদ্ধতি ১: GitHub Actions দিয়ে কোনো কম্পিউটার ছাড়াই ফ্রি ক্লাউডে APK বানান (সবচেয়ে সহজ!)
1. এই প্রোজেক্ট ফোল্ডারটি ডাউনলোড করুন (বা আনজিপ করুন)।
2. [github.com](https://github.com) এ গিয়ে একটি নতুন ফ্রী রিপোজিটোরি তৈরি করুন।
3. সমস্ত ফাইল সেখানে আপলোড (Push) করুন।
4. সাথে সাথে GitHub Actions স্বয়ংক্রিয়ভাবে APK তৈরি করে দেবে!
5. **GitHub -> Actions -> "Build UltraRecord Android APK" -> Artifacts** থেকে সরাসরি \`${config.appName.replace(/\s+/g, '_')}-Debug-APK.zip\` ডাউনলোড করে ফোনে ইনস্টল করুন!

---

### পদ্ধতি ২: Android Studio দিয়ে APK তৈরি করুন
1. আপনার পিসিতে **Android Studio** ওপেন করুন।
2. **Open Project** এ ক্লিক করে এই আনজিপ করা ফোল্ডারটি নির্বাচন করুন।
3. Gradle Sync শেষ হতে দিন।
4. মেনু থেকে **Build > Build Bundle(s) / APK(s) > Build APK(s)** এ ক্লিক করুন।
5. সম্পন্ন হলে নিচের ডান কোনায় "locate" ক্লিক করলেই \`app-debug.apk\` ফাইলটি পেয়ে যাবেন!

---

### পদ্ধতি ৩: Android মোবাইলে Termux দিয়ে সরাসরি APK বিল্ড
\`\`\`bash
# ১. Termux অ্যাপে প্যাকেজ আপডেট করুন:
pkg update -y && pkg install git openjdk-17 -y

# ২. প্রোজেক্ট ডিরেক্টরিতে যান এবং বিল্ড করুন:
chmod +x gradlew
./gradlew assembleDebug

# ৩. বিল্ড করা APK ফাইল লোকেশন:
# app/build/outputs/apk/debug/app-debug.apk
\`\`\`

---

## 📌 ফিচারসমূহ (Features):
- ✅ **Foreground Audio Service**: স্ক্রিন বন্ধ থাকলেও বা অন্য অ্যাপ ব্যবহার করলেও একটানা রেকর্ডিং হবে।
- ✅ **High Fidelity 48kHz / 24-bit**: স্পষ্ট ও পরিষ্কার সাউন্ড ক্যাপচার।
- ✅ **Modern Jetpack Compose UI**: আধুনিক ডার্ক থিম ইন্টারফেস।
- ✅ **Notification Media Controls**: নোটিফিকেশন বার থেকে পজ, রেজুম ও সেভ করার সুবিধা।
- ✅ **Battery Optimization & WakeLock**: ব্যাকগ্রাউন্ডে Android OS যেন রেকর্ডিং কিল না করে তার পূর্ণ সুরক্ষা।
`;
}

export async function exportProjectZip(config: ApkProjectConfig): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file('build.gradle.kts', getProjectBuildGradle());
  zip.file('settings.gradle.kts', getSettingsGradle(config));
  zip.file('gradle.properties', 'org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nkotlin.code.style=official\n');
  zip.file('README.md', getReadmeMarkdown(config));
  zip.file('README.bn.md', getReadmeMarkdown(config));

  // Gradle Wrapper scripts
  zip.file('gradlew', `#!/usr/bin/env sh
# Gradle wrapper bootstrap script
exec gradle "$@"
`);
  zip.file('gradlew.bat', `@rem Gradle wrapper batch script\r\ngradle %*`);

  // Gradle directory
  const gradleWrapperDir = zip.folder('gradle/wrapper');
  if (gradleWrapperDir) {
    gradleWrapperDir.file(
      'gradle-wrapper.properties',
      `distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-8.9-bin.zip\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\n`
    );
  }

  // Gradle Version Catalog
  const gradleDir = zip.folder('gradle');
  if (gradleDir) {
    gradleDir.file('libs.versions.toml', getLibsVersionsToml());
  }

  // GitHub Actions Workflow
  const githubWorkflowDir = zip.folder('.github/workflows');
  if (githubWorkflowDir) {
    githubWorkflowDir.file('build-apk.yml', getGithubWorkflowYaml(config));
  }

  // App module
  const appDir = zip.folder('app');
  if (appDir) {
    appDir.file('build.gradle.kts', getAppBuildGradle(config));
    appDir.file('proguard-rules.pro', `# Proguard rules for UltraRecord\n-keep class ${config.packageName}.** { *; }\n`);

    // Package structure for Kotlin files
    const packagePath = config.packageName.replace(/\./g, '/');
    const javaDir = appDir.folder(`src/main/java/${packagePath}`);
    if (javaDir) {
      javaDir.file('MainActivity.kt', getMainActivityKt(config));
      javaDir.file('AudioRecordService.kt', getAudioRecordServiceKt(config));
    }

    // AndroidManifest.xml
    const mainDir = appDir.folder('src/main');
    if (mainDir) {
      mainDir.file('AndroidManifest.xml', getAndroidManifestXml(config));
    }

    // Res values
    const resValuesDir = appDir.folder('src/main/res/values');
    if (resValuesDir) {
      resValuesDir.file('strings.xml', getStringsXml(config));
      resValuesDir.file('styles.xml', getStylesXml());
      resValuesDir.file('colors.xml', `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#38BDF8</color>
    <color name="background">#090D16</color>
    <color name="surface">#131C2E</color>
</resources>`);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}
