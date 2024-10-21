import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart, defaults } from 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import loader from './loader.gif';

function App() {
  defaults.responsive = true;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const savedFilter = localStorage.getItem('filter');
    const savedStartDate = localStorage.getItem('startDate');
    const savedEndDate = localStorage.getItem('endDate');

    if (savedFilter) setFilter(savedFilter);
    if (savedStartDate) setStartDate(savedStartDate);
    if (savedEndDate) setEndDate(savedEndDate);

    axios.get('https://www.yool.education/api/student-connections')
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("There was an error fetching the data!", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('filter', filter);
    localStorage.setItem('startDate', startDate);
    localStorage.setItem('endDate', endDate);
  }, [filter, startDate, endDate]);

  const filterDataByDateRange = (data, start, end) => {
    if (!start || !end) {
      return data; // If no date is selected, return all data
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    return data.filter(item => {
      const itemDate = new Date(item.day);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const aggregateData = (data, filter) => {
    const filteredData = filterDataByDateRange(data, startDate, endDate);

    if (filter === 'all') {
      return {
        labels: filteredData.map(item => item.day),
        datasets: [
          {
            label: 'Connections',
            data: filteredData.map(item => item.connections),
            backgroundColor: '#6495ed',
            borderColor: '#6495ed',
            hourData: filteredData.map(item => item.hour),
          },
        ],
      };
    }

    const aggregatedData = {};
    filteredData.forEach(item => {
      const date = new Date(item.day);
      let label;

      if (filter === 'monthly') {
        label = date.toLocaleString('default', { month: 'long' });
      } else if (filter === 'weekly') {
        const weekNumber = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
        label = `${date.toLocaleString('default', { month: 'long' })} - Week ${weekNumber}`;
      } else if (filter === 'daily') {
        label = date.toLocaleDateString();
      }

      if (!aggregatedData[label]) {
        aggregatedData[label] = { hour: 0, connections: 0 };
      }

      aggregatedData[label].hour += item.hour;
      aggregatedData[label].connections += item.connections;
    });

    return {
      labels: Object.keys(aggregatedData),
      datasets: [
        {
          label: 'Connections',
          data: Object.values(aggregatedData).map(month => month.connections),
          backgroundColor: '#6495ed',
          borderColor: '#6495ed',
          hourData: Object.values(aggregatedData).map(month => month.hour),
        },
      ],
    };
  };

  // Function to clear filters and dates
  const clearFilters = () => {
    setFilter('all');
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return (
      <div className='bg-gray-100 dark:bg-gray-900 w-full h-screen flex justify-center items-center'>
        <img src={loader} className='w-16' alt="Loading..." />
      </div>
    );
  }

  const chartData = aggregateData(data, filter);

  return (
    <div className='py-5'>
      <div className="container w-[70%] m-auto">
        <h1 className='font-extrabold py-4' style={{ color: '#F07F19', textAlign: 'center', fontFamily: 'cursive', fontSize: '50px' }}>
          Student Connections Graph
        </h1>

        <div className='flex justify-between items-center mb-4' style={{ fontFamily: 'cursive' }}>
          <div className='flex'>
            <div className='mr-2'>
              <label className='text-gray-400'>Start Date:</label>
              <input 
                type="date"
                className='bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-700 rounded-md py-1 px-2'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className='text-gray-400'>End Date:</label>
              <input 
                type="date"
                className='bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-gray-700 rounded-md py-1 px-2'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className='flex items-center'>
            <label htmlFor="filter-select" className='text-gray-400'>Filter By: </label>
            <select 
              className='bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-center text-gray-700 rounded-md py-1 px-2 ml-2'
              id="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="monthly">Month</option>
              <option value="weekly">Week</option>
              <option value="daily">Day</option>
            </select>

            {/* Clear Button */}
            <button 
              className='bg-red-500 text-white rounded-md py-1 px-4 ml-4'
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </div>

        <Line 
          data={{
            labels: chartData.labels,
            datasets: chartData.datasets,
          }}
          options={{
            elements: {
              line: {
                borderWidth: 2,
              },
            },
            scales: {
              y: {
                suggestedMax: 400,
                beginAtZero: true,
                ticks: {
                  padding: 10,
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (tooltipItem) => {
                    const index = tooltipItem.dataIndex;
                    const connections = chartData.datasets[0].data[index];
                    const hours = chartData.datasets[0].hourData[index];
                    return [`Connections: ${connections}`, `Hour: ${hours}:00`];
                  },
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export default App;
