import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Image, Button } from 'react-native';
import { useCameraPermission, useMicrophonePermission, useCameraDevice, Camera, useCodeScanner } from 'react-native-vision-camera';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import { useFocusEffect } from '@react-navigation/native';
import Reanimated, { useAnimatedProps, useSharedValue, interpolate, Extrapolation, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

Reanimated.addWhitelistedNativeProps({
  zoom: true,
});
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

const CameraScreen = () => {
  const [cameraDevice, setCameraDevice] = useState('back');
  const device = useCameraDevice(cameraDevice, { physicalDevices: ['ultra-wide-angle-camera'] });
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      runOnJS(console.log)(`Scanned ${codes.length} codes!`);
      runOnJS(console.log)(codes[0]);
    },
  });

  const { hasPermission, requestPermission } = useCameraPermission();
  const { hasPermission: microphonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  const [isActive, setIsActive] = useState(false);
  const [flash, setFlash] = useState('off');
  const [isRecording, setIsRecording] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [video, setVideo] = useState(null);
  const camera = useRef(null);
  const [mode, setMode] = useState('camera');

  const zoom = useSharedValue(device?.neutralZoom || 1);
  const zoomOffset = useSharedValue(0);

  const gesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value;
    })
    .onUpdate((event) => {
      'worklet';
      const z = zoomOffset.value * event.scale;
      zoom.value = interpolate(
        z,
        [1, 10],
        [device?.minZoom || 1, device?.maxZoom || 10],
        Extrapolation.CLAMP,
      );
    });

  const animatedProps = useAnimatedProps(
    () => ({ zoom: zoom.value }),
    [zoom]
  );

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => setIsActive(false);
    }, [])
  );

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
    if (!microphonePermission) {
      requestMicrophonePermission();
    }
  }, [hasPermission, microphonePermission]);

  const onTakePicturePressed = async () => {
    if (isRecording) {
      camera.current?.stopRecording();
      return;
    }
    const photo = await camera.current?.takePhoto({ flash });
    setPhoto(photo);
  };

  const onStartRecording = async () => {
    if (!camera.current) return;
    setIsRecording(true);
    camera.current.startRecording({
      flash: flash === 'on' ? 'on' : 'off',
      onRecordingFinished: (video) => {
        runOnJS(setIsRecording)(false);
        runOnJS(setVideo)(video);
      },
      onRecordingError: (error) => {
        runOnJS(console.error)(error);
        runOnJS(setIsRecording)(false);
      },
    });
  };

  const uploadPhoto = async () => {
    if (!photo) return;
    const result = await fetch(`file://${photo.path}`);
    const data = await result.blob();
    // upload data to your network storage (e.g., S3, Supabase storage, etc.)
  };

  if (!hasPermission || !microphonePermission) {
    return <ActivityIndicator />;
  }

  if (!device) {
    return <Text>Camera device not found</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      {mode === 'qr' ? (
        <Camera
          device={device}
          codeScanner={codeScanner}
          style={StyleSheet.absoluteFill}
          isActive={mode === 'qr' && isActive && !photo && !video}
        />
      ) : (
        <GestureDetector gesture={gesture}>
          <ReanimatedCamera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive && !photo && !video && mode === 'camera'}
            animatedProps={animatedProps}
            photo
            video
            audio
          />
        </GestureDetector>
      )}

      {video && (
        <Video
          style={StyleSheet.absoluteFill}
          source={{ uri: video.path }}
          useNativeControls
          isLooping
        />
      )}

      {photo && (
        <>
          <Image source={{ uri: photo.path }} style={StyleSheet.absoluteFill} />
          <FontAwesome5
            onPress={() => setPhoto(null)}
            name="arrow-left"
            size={25}
            color="white"
            style={{ position: 'absolute', top: 50, left: 30 }}
          />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 50, backgroundColor: 'rgba(0, 0, 0, 0.40)' }}>
            <Button title="Upload" onPress={uploadPhoto} />
          </View>
        </>
      )}

      {!photo && !video && (
        <>
          <View style={{ position: 'absolute', left: 10, top: 600, padding: 10, borderRadius: 5, backgroundColor: 'rgba(0, 0, 0, 0.40)' }}>
            <MaterialIcons
              name={cameraDevice === 'back' ? 'camera-front' : 'camera-rear'}
              onPress={() => setCameraDevice(cameraDevice === 'back' ? 'front' : 'back')}
              size={30}
              color="white"
            />
          </View>

          <View style={{ position: 'absolute', right: 30, top: 600, padding: 10, borderRadius: 5, backgroundColor: 'rgba(0, 0, 0, 0.40)', gap: 30 }}>
            <MaterialIcons
              name={flash === 'off' ? 'flash-off' : 'flash-on'}
              onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
              size={30}
              color="white"
            />
          </View>

          <Pressable
            onPress={onTakePicturePressed}
            onLongPress={onStartRecording}
            style={{
              position: 'absolute',
              alignSelf: 'center',
              bottom: 50,
              width: 75,
              height: 75,
              backgroundColor: isRecording ? 'red' : 'white',
              borderRadius: 75,
            }}
          />
        </>
      )}
    </View>
  );
};

export default CameraScreen;

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
});
