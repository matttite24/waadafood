import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, DeviceEventEmitter } from 'react-native';
import { useTheme, TextInput, Button, Chip, Text } from 'react-native-paper';
import MenuList from '@/components/menu/MenuList';
import AppFAB from '@/components/AppFAB';
import AppBottomSheet from '@/components/AppBottomSheet';
import { useWindowDimensions, Platform } from 'react-native';
import { Package } from 'phosphor-react-native';



export default function MenuScreen() {
    return (
        <View style={{ flex: 1 }}>
            <MenuList />
        </View>
    );
}

const styles = StyleSheet.create({
    textInput: {
        backgroundColor: 'transparent',
    }
});
