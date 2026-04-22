import axios from 'axios';

async function seedData() {
  try {
    const response = await axios.post('http://localhost:8088/api/dev/seed?key=secret123');
    console.log('Seed data response:', response.data);
  } catch (error) {
    console.error('Failed to seed data:', error.message);
  }
}

seedData();
