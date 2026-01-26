import React from 'react';
import { View, useWindowDimensions, Platform, LayoutAnimation, TouchableOpacity } from 'react-native';
import { Text, IconButton, useTheme, Avatar } from 'react-native-paper';
import { BlurView } from 'expo-blur';
import { Icon, ArrowLeft, CaretLeft, MagnifyingGlass, X, ArrowsClockwise } from 'phosphor-react-native';
import { TextInput } from 'react-native-paper';
import NotificationBadge from './NotificationBadge';

interface GlassmorphicHeaderProps {
    title: string;
    subtitle?: string;
    icon: Icon;
    iconColor?: string;
    children?: React.ReactNode;
    onBack?: () => void;
    onRightPress?: () => void;
    rightIconActive?: boolean;
    actionButton?: React.ReactNode;
    transparent?: boolean;
    dark?: boolean;
    searchable?: boolean;
    searchQuery?: string;
    onSearchChange?: (text: string) => void;
    searchPlaceholder?: string;
    onClientePress?: () => void;
    rightIcon?: Icon;
    badgeCount?: number;
    avatarUri?: string;
    avatarLabel?: string;
}

export default function GlassmorphicHeader({
    title,
    subtitle,
    icon: Icon,
    iconColor,
    children,
    onBack,
    onRightPress,
    rightIconActive,
    actionButton,
    transparent,
    dark,
    searchable,
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Buscar...",
    onClientePress,
    rightIcon,
    badgeCount,
    avatarUri,
    avatarLabel,
}: GlassmorphicHeaderProps) {
    const [isSearchActive, setIsSearchActive] = React.useState(false);

    const toggleSearch = (active: boolean) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSearchActive(active);
        if (!active) onSearchChange?.('');
    };
    const theme = useTheme();
    const finalIconColor = iconColor || '#00754A';
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024 && Platform.OS === 'web';

    if (isDesktop) return null;

    const isDarkGlobal = dark || transparent;
    const effectiveIsDark = dark || transparent || isSearchActive;
    const Container = (transparent || dark || isSearchActive) ? View : BlurView;
    const textColor = effectiveIsDark ? "#FFFFFF" : "#1E3932";

    return (
        <Container
            {...((transparent || dark) ? {} : { intensity: 50, tint: "extraLight" })}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                backgroundColor: isSearchActive
                    ? '#1E3932'
                    : (isDarkGlobal ? 'transparent' : 'rgba(242, 240, 235, 0.5)'),
                borderBottomWidth: 0,
                borderBottomColor: effectiveIsDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 117, 74, 0.05)',
            }}
        >
            <View style={{
                width: '100%',
                paddingTop: Platform.OS === 'ios' ? 16 : 16,
                paddingBottom: 16,
            }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    minHeight: 42,
                    marginBottom: children ? 6 : 0
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {(onBack || isSearchActive) && (
                            <TouchableOpacity
                                onPress={isSearchActive ? () => toggleSearch(false) : onBack}
                                style={{ marginRight: 12 }}
                            >
                                <CaretLeft size={28} color={textColor} />
                            </TouchableOpacity>
                        )}

                        <View style={{ flex: 1, marginLeft: 8 }}>
                            {isSearchActive ? (
                                <TextInput
                                    autoFocus
                                    value={searchQuery}
                                    onChangeText={onSearchChange}
                                    placeholder={searchPlaceholder}
                                    placeholderTextColor={effectiveIsDark ? "rgba(255,255,255,0.5)" : "rgba(30, 57, 50, 0.4)"}
                                    mode="flat"
                                    dense
                                    style={{
                                        backgroundColor: 'transparent',
                                        height: 40,
                                        fontSize: 16,
                                        color: textColor,
                                        paddingHorizontal: 0,
                                        margin: 0,
                                    }}
                                    contentStyle={{
                                        paddingLeft: 0,
                                    }}
                                    textColor={textColor}
                                    underlineColor="transparent"
                                    activeUnderlineColor="transparent"
                                    selectionColor="#FFFFFF"
                                    right={
                                        searchQuery ? (
                                            <TextInput.Icon
                                                icon={() => <X size={20} color={textColor} />}
                                                onPress={() => onSearchChange?.('')}
                                            />
                                        ) : null
                                    }
                                />
                            ) : (
                                <>
                                    {onClientePress ? (
                                        <TouchableOpacity onPress={onClientePress} activeOpacity={0.7}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                {(avatarUri || avatarLabel) && (
                                                    <Avatar.Text
                                                        size={36}
                                                        label={avatarLabel || '?'}
                                                        style={{ backgroundColor: '#D4E9E2' }}
                                                        labelStyle={{ color: '#00754A', fontWeight: '900', fontSize: 14 }}
                                                    />
                                                )}
                                                <View>
                                                    <Text
                                                        variant="titleMedium"
                                                        style={{
                                                            fontWeight: '800',
                                                            color: rightIconActive ? '#00754A' : textColor,
                                                            letterSpacing: -0.5,
                                                            fontSize: 16,
                                                            lineHeight: 20,
                                                            textShadowColor: (effectiveIsDark && !isSearchActive) ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                                                            textShadowOffset: { width: 0, height: 1 },
                                                            textShadowRadius: 4,
                                                        }}
                                                        numberOfLines={1}
                                                        ellipsizeMode="tail"
                                                    >
                                                        {title}
                                                    </Text>
                                                    {subtitle && (
                                                        <Text
                                                            style={{
                                                                fontSize: 12,
                                                                color: effectiveIsDark ? "rgba(255,255,255,0.7)" : "rgba(30, 57, 50, 0.6)",
                                                                fontWeight: '500',
                                                                marginTop: -2,
                                                            }}
                                                        >
                                                            {subtitle}
                                                        </Text>
                                                    )}
                                                </View>
                                                {badgeCount !== undefined && badgeCount > 0 && (
                                                    <NotificationBadge count={badgeCount} size="small" />
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            {(avatarUri || avatarLabel) && (
                                                <Avatar.Text
                                                    size={36}
                                                    label={avatarLabel || '?'}
                                                    style={{ backgroundColor: '#D4E9E2' }}
                                                    labelStyle={{ color: '#00754A', fontWeight: '900', fontSize: 14 }}
                                                />
                                            )}
                                            <View>
                                                <Text
                                                    variant="titleMedium"
                                                    style={{
                                                        fontWeight: '800',
                                                        color: rightIconActive ? '#00754A' : textColor,
                                                        letterSpacing: -0.5,
                                                        fontSize: 16,
                                                        lineHeight: 20,
                                                        textShadowColor: (effectiveIsDark && !isSearchActive) ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
                                                        textShadowOffset: { width: 0, height: 1 },
                                                        textShadowRadius: 4,
                                                    }}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    {title}
                                                </Text>
                                                {subtitle && (
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            color: effectiveIsDark ? "rgba(255,255,255,0.7)" : "rgba(30, 57, 50, 0.6)",
                                                            fontWeight: '500',
                                                            marginTop: -2,
                                                        }}
                                                    >
                                                        {subtitle}
                                                    </Text>
                                                )}
                                            </View>
                                            {badgeCount !== undefined && badgeCount > 0 && (
                                                <NotificationBadge count={badgeCount} size="small" />
                                            )}
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 44, justifyContent: 'flex-end' }}>
                        {searchable && !isSearchActive && (
                            <IconButton
                                icon={() => <MagnifyingGlass size={22} color={textColor} />}
                                onPress={() => toggleSearch(true)}
                                style={{ margin: 0, marginRight: 0 }}
                            />
                        )}
                        <View style={{ marginLeft: 4 }}>
                            {actionButton ? (
                                <View>{actionButton}</View>
                            ) : onRightPress ? (
                                <IconButton
                                    icon={() => {
                                        const RightIcon = rightIcon || Icon;
                                        return <RightIcon size={22} color="#FFFFFF" />;
                                    }}
                                    onPress={onRightPress}
                                    style={{
                                        backgroundColor: theme.colors.primary,
                                        borderRadius: 99,
                                        margin: 0,
                                        width: 44,
                                        height: 44,
                                        shadowColor: theme.colors.primary,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.5,
                                        shadowRadius: 12,
                                        elevation: 8,
                                        borderWidth: 0,
                                    }}
                                />
                            ) : (
                                <View style={{
                                    backgroundColor: theme.colors.primary,
                                    padding: 10,
                                    borderRadius: 99,
                                    width: 44,
                                    height: 44,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: theme.colors.primary,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.5,
                                    shadowRadius: 12,
                                    elevation: 6,
                                }}>
                                    <Icon size={22} color="#FFFFFF" />
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {!isSearchActive && children}
            </View>
        </Container>
    );
}
