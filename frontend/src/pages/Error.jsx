import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

const Error = ({ status = '404', title = 'Page Not Found', subTitle = 'This page is under development or experiencing an error.' }) => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
            <Result
                status={status}
                title={title}
                subTitle={subTitle}
                extra={[
                    <Button key="home" type="primary" onClick={() => navigate('/')}>
                        Go to Home
                    </Button>,
                    <Button key="back" onClick={() => navigate(-1)}>
                        Back to Previous Page
                    </Button>,
                ]}
                style={{
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                }}
            />
        </div>
    );
};

export default Error;
