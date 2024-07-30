import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Home = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Home</Text>
            <Button
                title="Go to Camera Screen"
                onPress={() => navigation.navigate('CameraScreen')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2c3e50',
    },
    title: {
        fontSize: 24,
        color: '#ffffff',
        marginBottom: 20,
    },
});

// Make this component available to the app
export default Home;
