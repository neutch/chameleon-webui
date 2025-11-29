import { useState, useEffect } from 'react';
import {
  Layout,
  Tabs,
  Button,
  Table,
  Input,
  InputNumber,
  Form,
  Switch,
  Space,
  message,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import {
  getOutputs,
  getSources,
  getConfig,
  updateOutputs,
  updateSources,
  updateConfig,
} from '../services/api';
import './Admin.css';

const { Header, Content } = Layout;
const { Title } = Typography;

const Admin = ({ onNavigateBack }) => {
  const [outputs, setOutputs] = useState([]);
  const [sources, setSources] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
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
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSources = async () => {
    setSaving(true);
    try {
      await updateSources(sources);
      message.success('Sources saved successfully');
    } catch (error) {
      message.error('Failed to save sources');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOutputs = async () => {
    setSaving(true);
    try {
      await updateOutputs(outputs);
      message.success('Outputs saved successfully');
    } catch (error) {
      message.error('Failed to save outputs');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async (values) => {
    setSaving(true);
    try {
      await updateConfig(values);
      message.success('Config saved successfully');
      loadData();
    } catch (error) {
      message.error('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const sourcesColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => {
            const newSources = [...sources];
            newSources[index].label = e.target.value;
            setSources(newSources);
          }}
        />
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => {
            const newSources = [...sources];
            newSources[index].type = e.target.value;
            setSources(newSources);
          }}
        />
      ),
    },
  ];

  const outputsColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      render: (text, record, index) => (
        <Input
          value={text}
          onChange={(e) => {
            const newOutputs = [...outputs];
            newOutputs[index].label = e.target.value;
            setOutputs(newOutputs);
          }}
        />
      ),
    },
    {
      title: 'Grid Row',
      key: 'row',
      render: (_, record, index) => (
        <InputNumber
          min={0}
          max={config?.gridRows - 1 || 5}
          value={record.gridPosition.row}
          onChange={(value) => {
            const newOutputs = [...outputs];
            newOutputs[index].gridPosition.row = value;
            setOutputs(newOutputs);
          }}
        />
      ),
    },
    {
      title: 'Grid Col',
      key: 'col',
      render: (_, record, index) => (
        <InputNumber
          min={0}
          max={config?.gridCols - 1 || 6}
          value={record.gridPosition.col}
          onChange={(value) => {
            const newOutputs = [...outputs];
            newOutputs[index].gridPosition.col = value;
            setOutputs(newOutputs);
          }}
        />
      ),
    },
  ];

  const tabItems = [
    {
      key: 'sources',
      label: 'Sources (Inputs)',
      children: (
        <div>
          <Table
            dataSource={sources}
            columns={sourcesColumns}
            rowKey="id"
            pagination={false}
            loading={loading}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveSources}
              loading={saving}
            >
              Save Sources
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'outputs',
      label: 'Outputs (TVs)',
      children: (
        <div>
          <Table
            dataSource={outputs}
            columns={outputsColumns}
            rowKey="id"
            pagination={false}
            loading={loading}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveOutputs}
              loading={saving}
            >
              Save Outputs
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'config',
      label: 'System Config',
      children: config && (
        <Form
          layout="vertical"
          initialValues={config}
          onFinish={handleSaveConfig}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label="Serial Port"
            name="serialPort"
            help="e.g., /dev/ttyUSB0 or /dev/ttyUSB1"
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Development Mode"
            name="devMode"
            valuePropName="checked"
            help="Enable to test without serial hardware"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="Grid Rows"
            name="gridRows"
          >
            <InputNumber min={1} max={20} />
          </Form.Item>
          <Form.Item
            label="Grid Columns"
            name="gridCols"
          >
            <InputNumber min={1} max={20} />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
            >
              Save Config
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <Layout className="admin-layout">
      <Header className="admin-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onNavigateBack}>
            Back to Grid
          </Button>
          <Title level={3} style={{ margin: 0, color: 'white' }}>
            Admin Panel
          </Title>
        </Space>
      </Header>
      <Content className="admin-content">
        <Tabs items={tabItems} />
      </Content>
    </Layout>
  );
};

export default Admin;
