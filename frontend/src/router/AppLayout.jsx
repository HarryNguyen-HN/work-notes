import { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    HomeOutlined,
    DashboardOutlined,
    InfoCircleOutlined,
    ClusterOutlined,
    SolutionOutlined,
    ToolOutlined,
    ApartmentOutlined,
    DatabaseOutlined,
    WarningOutlined,
    ScheduleOutlined,
    ExperimentOutlined,
    MobileOutlined,
} from '@ant-design/icons';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher'; // Import LanguageSwitcher
import { useTranslation } from 'react-i18next';

function getItem(label, key, icon, children) {
    return {
        label,
        key,
        icon,
        children,
    };
}

const { Header, Content, Sider, Footer } = Layout;
const siderStyle = {
    overflow: 'auto',
    height: '100vh',
    position: 'fixed',
    insetInlineStart: 0,
    top: 0,
    bottom: 0,
    scrollbarWidth: 'thin',
    scrollbarGutter: 'stable',
};

const AppLayout = () => {
    const { t } = useTranslation();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const [collapsed, setCollapsed] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const selectedKey = location.pathname.split('/').pop();

    const handleMenuClick = ({ key }) => {
        navigate(`/${key}`);
    };
    const items = [
        getItem(
            <NavLink to="/" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                {t('menu.home1')}
            </NavLink>,
            '',
            <HomeOutlined />
        ),
        getItem(
            <NavLink to="/home2" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                {t('menu.home2')}
            </NavLink>,
            'home2',
            <ClusterOutlined />
        ),
        getItem(
            t('menu.dashboard'),
            'dashboard',
            <DashboardOutlined />,
            [
                getItem(
                    <NavLink to="/member" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                        {t('menu.member')}
                    </NavLink>,
                    'member',
                    <SolutionOutlined />
                ),
                getItem(
                    <NavLink to="/handler" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                        {t('menu.handler')}
                    </NavLink>,
                    'handler',
                    <ToolOutlined />
                ),
                getItem(
                    <NavLink to="/dept" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                        {t('menu.dept')}
                    </NavLink>,
                    'dept',
                    <ApartmentOutlined />
                ),
                getItem(
                    <NavLink to="/inventory" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                        {t('menu.inventory')}
                    </NavLink>,
                    'inventory',
                    <DatabaseOutlined />
                ),
                getItem(
                    <NavLink to="/type-abnormal" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                        {t('menu.type_abnormal')}
                    </NavLink>,
                    'type-abnormal',
                    <WarningOutlined />
                ),
            ]
        ),
        getItem(
            <NavLink to="/job-tracker" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                {t('menu.jobTracker')}
            </NavLink>,
            'job-tracker',
            <ScheduleOutlined />
        ),
        getItem(
            <NavLink to="/mis-storage" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                {t('menu.mis_storage')}
            </NavLink>,
            'mis-storage',
            <DatabaseOutlined />
        ),
        getItem(<NavLink to="/device" className={({ isActive }) => (isActive ? 'active-link' : '')}>{t('menu.device')}</NavLink>, 'device', <MobileOutlined />),
        getItem(
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                {t('menu.about')}
            </NavLink>,
            'about',
            <InfoCircleOutlined />
        ),
        getItem(
            <NavLink to="/test" className={({ isActive }) => (isActive ? 'active-link' : '')}>
                Test
            </NavLink>,
            'test',
            <ExperimentOutlined />
        ),
    ];

    return (
        <Layout hasSider>
            <Sider style={siderStyle} collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div className="demo-logo-vertical" />
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['4']} items={items} />
                <div
                    style={{
                        position: 'absolute',
                        bottom: 16,
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    <LanguageSwitcher />
                </div>
            </Sider>
            <Layout
                style={{
                    marginInlineStart: collapsed ? 80 : 200,
                }}
            >
                <Header
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 999,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div className="demo-logo"/>
                    <Menu
                        theme="dark"
                        selectedKeys={[selectedKey]}
                        mode="horizontal"
                        items={items}
                        onClick={handleMenuClick}
                        style={{
                            flex: 1,
                            minWidth: 0,
                        }}
                    />
                    <LanguageSwitcher />
                </Header>
                <Content
                    style={{
                        margin: '24px 16px 0',
                        overflow: 'initial',
                    }}
                >
                    <div
                        style={{
                            padding: 24,
                            textAlign: 'center',
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        <Outlet />
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    Ant Design ©{new Date().getFullYear()} Created by Ant UED
                </Footer>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
