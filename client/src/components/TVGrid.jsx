import { Card, Typography, Tag } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';
import './TVGrid.css';

const { Text } = Typography;

const TVGrid = ({ outputs, sources, config, onTVClick }) => {
  // Create a 2D grid based on config
  const grid = Array(config.gridRows)
    .fill(null)
    .map(() => Array(config.gridCols).fill(null));

  // Place TVs in grid
  outputs.forEach((output) => {
    const { row, col } = output.gridPosition;
    if (row < config.gridRows && col < config.gridCols) {
      grid[row][col] = output;
    }
  });

  const getSourceLabel = (sourceId) => {
    const source = sources.find((s) => s.id === sourceId);
    return source ? source.label : 'No Source';
  };

  return (
    <div className="tv-grid-container">
      <div
        className="tv-grid"
        style={{
          gridTemplateColumns: `repeat(${config.gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${config.gridRows}, 1fr)`,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((tv, colIndex) => {
            if (!tv) {
              return (
                <div
                  key={`empty-${rowIndex}-${colIndex}`}
                  className="tv-cell empty"
                />
              );
            }

            return (
              <Card
                key={tv.id}
                className="tv-cell tv-card"
                hoverable
                onClick={() => onTVClick(tv)}
              >
                <div className="tv-content">
                  <DesktopOutlined className="tv-icon" />
                  <Text strong className="tv-label">
                    {tv.label}
                  </Text>
                  {tv.currentSource ? (
                    <Tag color="blue" className="tv-source">
                      {getSourceLabel(tv.currentSource)}
                    </Tag>
                  ) : (
                    <Tag className="tv-source">No Source</Tag>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TVGrid;
