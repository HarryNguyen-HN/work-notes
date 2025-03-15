/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Menu, Dropdown, Space } from 'antd';
import { FlagOutlined } from '@ant-design/icons';
import i18n from 'i18next';

// Các tùy chọn ngôn ngữ
const languageOptions = {
    'en-US': { label: 'English', icon: <FlagOutlined />, code: 'EN' },
    'vi-VN': { label: 'Tiếng Việt', icon: <FlagOutlined />, code: 'VI' },
    'zh-CN': { label: '中文', icon: <FlagOutlined />, code: 'ZH' },
    'zh-TW': { label: '繁體', icon: <FlagOutlined />, code: 'TW' },
};

const LanguageSwitcher = () => {
    const storedLanguage = localStorage.getItem('i18nextLng') || 'en-US';
    const formattedLanguage = storedLanguage.includes('-')
        ? storedLanguage
        : `${storedLanguage}-${storedLanguage.toUpperCase()}`;
    const defaultLanguage = Object.keys(languageOptions).find(
        (lang) => lang.toLowerCase() === formattedLanguage.toLowerCase()
    ) || 'en-US';
    
    const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);

    const handleLanguageChange = ({ key }) => {
        if (languageOptions[key]) {
            setCurrentLanguage(key);
            i18n.changeLanguage(key); // Thay đổi ngôn ngữ trong i18n
            localStorage.setItem('i18nextLng', key); // Lưu vào localStorage
        }
    };

    // Tạo menu cho Dropdown
    const menuItems = Object.entries(languageOptions).map(([key, { label, icon }]) => ({
        label: (
            <Space>
                {icon}
                {label}
            </Space>
        ),
        key,
    }));

    return (
        <Dropdown
            menu={{
                items: menuItems, // Sử dụng thuộc tính `menu`
                onClick: handleLanguageChange, // Xử lý sự kiện click
            }}
            trigger={['click']}
        >
            <Space style={{ color: 'white', cursor: 'pointer' }}>
                {languageOptions[currentLanguage]?.icon}
                {languageOptions[currentLanguage]?.code}
            </Space>
        </Dropdown>
    );
};

export default LanguageSwitcher;
