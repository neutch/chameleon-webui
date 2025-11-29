import { useState } from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const { Title } = Typography;

const Login = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleNumberClick = (num) => {
    if (pin.length < 8) {
      setPin(pin + num);
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = async () => {
    if (pin.length === 0) return;

    setLoading(true);
    const success = await login(pin);
    setLoading(false);

    if (!success) {
      setPin('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Backspace') {
      setPin(pin.slice(0, -1));
    } else if (e.key >= '0' && e.key <= '9') {
      handleNumberClick(e.key);
    }
  };

  return (
    <div className="login-container" onKeyDown={handleKeyPress} tabIndex={0}>
      <Card className="login-card" bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2} style={{ textAlign: 'center', margin: 0 }}>
            Chameleon Control
          </Title>

          <div className="pin-display">
            {pin.split('').map((_, index) => (
              <div key={index} className="pin-dot" />
            ))}
            {[...Array(Math.max(0, 4 - pin.length))].map((_, index) => (
              <div key={`empty-${index}`} className="pin-dot empty" />
            ))}
          </div>

          <div className="pin-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                size="large"
                onClick={() => handleNumberClick(num.toString())}
                className="pin-button"
              >
                {num}
              </Button>
            ))}
            <Button
              size="large"
              icon={<DeleteOutlined />}
              onClick={handleClear}
              className="pin-button clear"
            />
            <Button
              size="large"
              onClick={() => handleNumberClick('0')}
              className="pin-button"
            >
              0
            </Button>
            <Button
              size="large"
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              className="pin-button submit"
            >
              Enter
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Login;
