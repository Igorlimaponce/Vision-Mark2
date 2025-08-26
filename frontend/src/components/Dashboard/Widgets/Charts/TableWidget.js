import React, { useState, useMemo } from 'react';
import { FiArrowUp, FiArrowDown, FiFilter, FiSearch } from 'react-icons/fi';

const TableWidget = ({ data, config, width, height }) => {
  const [sortBy, setSortBy] = useState(config.defaultSort || 'value');
  const [sortOrder, setSortOrder] = useState(config.defaultOrder || 'desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'label', title: 'Pipeline', sortable: true },
      { key: 'value', title: config.metric || 'Valor', sortable: true }
    ];

    // Add additional columns based on available data
    if (data.length > 0 && data[0].data) {
      const additionalMetrics = [
        { key: 'current_fps', title: 'FPS' },
        { key: 'total_detections', title: 'Detecções' },
        { key: 'avg_cpu', title: 'CPU %' },
        { key: 'total_alerts', title: 'Alertas' },
        { key: 'uptime', title: 'Uptime (h)' }
      ];

      additionalMetrics.forEach(metric => {
        if (data[0].data[metric.key] !== undefined) {
          baseColumns.push({
            key: metric.key,
            title: metric.title,
            sortable: true
          });
        }
      });
    }

    return baseColumns;
  }, [data, config.metric]);

  const processedData = useMemo(() => {
    let processed = data.map(item => ({
      ...item,
      ...item.data
    }));

    // Apply search filter
    if (searchTerm) {
      processed = processed.filter(item =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      processed = processed.filter(item => {
        if (filterBy === 'high') return item.value > getThreshold('high');
        if (filterBy === 'medium') return item.value > getThreshold('medium') && item.value <= getThreshold('high');
        if (filterBy === 'low') return item.value <= getThreshold('medium');
        return true;
      });
    }

    // Apply sorting
    processed.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return processed;
  }, [data, searchTerm, filterBy, sortBy, sortOrder]);

  const getThreshold = (level) => {
    const max = Math.max(...data.map(d => d.value));
    if (level === 'high') return max * 0.7;
    if (level === 'medium') return max * 0.4;
    return 0;
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatCellValue = (value, column) => {
    if (value === undefined || value === null) return '-';

    if (column === 'current_fps') return `${value} fps`;
    if (column === 'avg_cpu') return `${value}%`;
    if (column === 'uptime') return `${value}h`;
    if (column === 'total_detections' || column === 'total_alerts') {
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toString();
    }

    return value.toString();
  };

  const getCellStyle = (value, column) => {
    if (column === 'avg_cpu') {
      if (value > 85) return { color: '#e53e3e', fontWeight: 'bold' };
      if (value > 70) return { color: '#f5576c' };
      return { color: '#43e97b' };
    }

    if (column === 'current_fps') {
      if (value < 10) return { color: '#e53e3e', fontWeight: 'bold' };
      if (value < 20) return { color: '#f5576c' };
      return { color: '#43e97b' };
    }

    return {};
  };

  const getRowClass = (item) => {
    if (config.highlightRows) {
      const value = item[config.metric] || item.value;
      const threshold = getThreshold('high');
      if (value > threshold) return 'row-high';
      if (value > getThreshold('medium')) return 'row-medium';
      return 'row-low';
    }
    return '';
  };

  return (
    <div className="table-widget" style={{ width, height }}>
      {/* Table Header with Controls */}
      <div className="table-controls">
        <div className="search-container">
          <FiSearch />
          <input
            type="text"
            placeholder="Buscar pipelines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <FiFilter />
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="high">Alto Desempenho</option>
            <option value="medium">Médio Desempenho</option>
            <option value="low">Baixo Desempenho</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable && handleSort(column.key)}
                  className={column.sortable ? 'sortable' : ''}
                >
                  <div className="th-content">
                    <span>{column.title}</span>
                    {column.sortable && sortBy === column.key && (
                      <span className="sort-indicator">
                        {sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.map((item, index) => (
              <tr key={index} className={getRowClass(item)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={getCellStyle(item[column.key], column.key)}
                  >
                    {formatCellValue(item[column.key], column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {processedData.length === 0 && (
          <div className="table-empty">
            <p>Nenhum dado encontrado</p>
            {searchTerm && (
              <small>Tente ajustar o termo de busca ou filtros</small>
            )}
          </div>
        )}
      </div>

      {/* Table Footer with Stats */}
      <div className="table-footer">
        <div className="table-stats">
          <span>
            Mostrando {processedData.length} de {data.length} itens
          </span>
          {searchTerm && (
            <span className="filter-info">
              • Filtrado por: "{searchTerm}"
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableWidget;
