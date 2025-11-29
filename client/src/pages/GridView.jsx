import { useState, useEffect } from 'react';
import { Layout, Button, Spin, Typography, Space, Tag } from 'antd';
import { LogoutOutlined, SettingOutlined, SyncOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { getOutputs, getSources, getConfig, getStatus } from '../services/api';
import TVGrid from '../components/TVGrid';
import SourceSelectionModal from '../components/SourceSelectionModal';
import './GridView.css';

const { Header, Content } = Layout;
const { Title } = Typography;

const GridView = ({ onNavigateAdmin }) => {
  const { logout, isAdmin } = useAuth();
  const [outputs, setOutputs] = useState([]);
  const [sources, setSources] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTV, setSelectedTV] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState({ connected: false });

  useEffect(() => {
    loadData();
    const statusInterval = setInterval(checkStatus, 5000);
    return () => clearInterval(statusInterval);
  }, []);

  const loadData = async () => {
    try {
      const [outputsRes, sourcesRes, configRes] = await Promise.all([
        getOutputs(),
        getSources(),
        getConfig(),
      ]);
      setOutputs(outputsRes.data);
      setSources(sourcesRes.data);
      setConfig(configRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await getStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const handleTVClick = (tv) => {
    setSelectedTV(tv);
    setModalVisible(true);
  };

  const handleSourceSelected = async (sourceId) => {
    setModalVisible(false);
    // Optimistically update UI
    setOutputs(outputs.map(o =>
      o.id === selectedTV.id ? { ...o, currentSource: sourceId } : o
    ));
    // Refresh data to confirm
    setTimeout(loadData, 500);
  };

  const handleRefresh = () => {
    setLoading(true);
    loadData();
    checkStatus();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="grid-view-layout">
      <Header className="grid-view-header">
        <Title level={3} style={{ margin: 0, color: 'white' }}>
          Chameleon Control
        </Title>
        <Space>
          <Tag color={config?.devMode ? 'orange' : (status.connected ? 'green' : 'red')}>
            {config?.devMode ? 'DEV MODE' : (status.connected ? 'Connected' : 'Disconnected')}
          </Tag>
          <Button
            icon={<SyncOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          {isAdmin && (
            <Button
              icon={<SettingOutlined />}
              onClick={onNavigateAdmin}
            >
              Admin
            </Button>
          )}
          <Button
            icon={<LogoutOutlined />}
            onClick={logout}
          >
            Logout
          </Button>
        </Space>
      </Header>
      <Content className="grid-view-content">
        <TVGrid
          outputs={outputs}
          sources={sources}
          config={config}
          onTVClick={handleTVClick}
        />
      </Content>
      <SourceSelectionModal
        visible={modalVisible}
        tv={selectedTV}
        sources={sources}
        outputs={outputs}
        onSelect={handleSourceSelected}
        onCancel={() => setModalVisible(false)}
      />
    </Layout>
  );
};

export default GridView;
