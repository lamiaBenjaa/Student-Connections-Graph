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

  useEffect(() => {
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

  const aggregateData = (data, filter) => {
    if (filter === 'all') { 
      return {
        labels: data.map(item => item.day), 
        datasets: [
          {
            label: 'Hour',
            data: data.map(item => item.hour),
            backgroundColor: '#F07F19',
            borderColor: '#F07F19',
          },
          {
            label: 'Connections',
            data: data.map(item => item.connections),
            backgroundColor: '#1a4080',
            borderColor: '#1a4080',
          },
        ],
      };
    }

    const aggregatedData = {};
    data.forEach(item => {
      const date = new Date(item.day);
      let label;

      // Determine label based on filter
      if (filter === 'monthly') {
        label = date.toLocaleString('default', { month: 'long' }); // Get month name
      } else if (filter === 'weekly') {
        // Get week number
        const weekNumber = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
        label = `${date.toLocaleString('default', { month: 'long' })} - Week ${weekNumber}`;
      } else if (filter === 'daily') {
        label = date.toLocaleDateString(); // Get full date
      }

      // Initialize the label if not already present
      if (!aggregatedData[label]) {
        aggregatedData[label] = { hour: 0, connections: 0 };
      }

      // Aggregate hour and connections
      aggregatedData[label].hour += item.hour;
      aggregatedData[label].connections += item.connections;
    });

    return {
      labels: Object.keys(aggregatedData),
      datasets: [
        {
          label: 'Hour',
          data: Object.values(aggregatedData).map(month => month.hour),
          backgroundColor: '#F07F19',
          borderColor: '#F07F19',
        },
        {
          label: 'Connections',
          data: Object.values(aggregatedData).map(month => month.connections),
          backgroundColor: '#1a4080',
          borderColor: '#1a4080',
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className='bg-gray-900 w-full h-screen flex justify-center items-center'>
        <img src={loader} className='w-16' alt="Loading..." />
      </div>
    );
  }

  // Aggregate data based on the current filter
  const chartData = aggregateData(data, filter);

  return (
    <div className=' py-5'> 
      <div className="container  w-[70%] m-auto ">
      <h1 className='font-extrabold py-4' style={{color:'#F07F19', textAlign:'center', fontFamily:'cursive', fontSize:'50px'}}>Student Connections Graph</h1>
      
      <div className='flex justify-end items-center' style={{fontFamily:'cursive'}}>
        <label htmlFor="filter-select" className='text-gray-400'>Filter By : </label>
        <select 
          className='bg-gray-200 dark:bg-gray-700 dark:text-gray-200 text-center text-gray-700 rounded-md py-1 px-2'
          id="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option> 
          <option value="monthly">Month</option>
          <option value="weekly">Week</option>
          <option value="daily">Day</option>
        </select>
      </div>

      <Line 
        data={{
          labels: chartData.labels,
          datasets: chartData.datasets,
        }}
        options={{
          elements: {
            line: {
              tension: 0.5,
              borderWidth: 2,
            },
            point: {
              pointStyle: false,
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
        }}
      />
    </div>

    </div>
   
  );
}

export default App;
