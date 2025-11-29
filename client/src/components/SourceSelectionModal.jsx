import { useState } from 'react';
import { Modal, Card, Typography, Space, Tag, message } from 'antd';
import { VideoCameraOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { routeOutput } from '../services/api';
import './SourceSelectionModal.css';

const { Title, Text } = Typography;

const SourceSelectionModal = ({ visible, tv, sources, outputs, onSelect, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);

  if (!tv) return null;

  const handleSourceClick = async (source) => {
    setSelectedSource(source.id);
    setLoading(true);

    try {
      await routeOutput(tv.id, source.id);
      message.success(`${tv.label} now showing ${source.label}`);
      onSelect(source.id);
    } catch (error) {
      message.error('Failed to route source');
      console.error('Route failed:', error);
    } finally {
      setLoading(false);
      setSelectedSource(null);
    }
  };

  const currentSourceId = tv.currentSource;

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      title={
        <Space>
          <Text>Select Source for</Text>
          <Text strong>{tv.label}</Text>
        </Space>
      }
    >
      <div className="source-grid">
        {sources.map((source) => {
          const isCurrentSource = source.id === currentSourceId;
          const isSelected = source.id === selectedSource;

          return (
            <Card
              key={source.id}
              className={`source-card ${isCurrentSource ? 'current' : ''} ${isSelected ? 'loading' : ''}`}
              hoverable
              onClick={() => !loading && handleSourceClick(source)}
            >
              <div className="source-content">
                <VideoCameraOutlined className="source-icon" />
                <Title level={4} className="source-label">
                  {source.label}
                </Title>
                {isCurrentSource && (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Current
                  </Tag>
                )}
                {isSelected && <div className="source-loading">Routing...</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </Modal>
  );
};

export default SourceSelectionModal;
