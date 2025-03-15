import { Button, notification } from 'antd';

const Notification = () => {
    const openNotification = (type, message) => {
        notification.open({
            type: type,
            message: message,
            description:
                'This is the content of the notification.',
            onClick: () => {
                console.log('Notification Clicked!');
            },
        });
    };
    return (
        <div>
            <Button onClick={() => openNotification('success', 'success title')}>Success</Button>
            <Button onClick={() => openNotification('info', 'info title')}>Info</Button>
            <Button onClick={() => openNotification('warning', 'warning title')}>Warning</Button>
            <Button onClick={() => openNotification('error', 'error title')}>Error</Button>
        </div>
    )
}

export default Notification
