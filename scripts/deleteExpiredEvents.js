const mongoose = require('mongoose');
const cron = require('node-cron');
const { connectDb } = require('../helpers/db-util'); 
const Show = require('../models/show-model'); 


async function deleteExpiredShows() {
  try {
    await connectDb(); 
    const nowUtc = new Date(new Date().toUTCString());
    nowUtc.setDate(nowUtc.getDate() - 1); 
    nowUtc.setUTCHours(23, 59, 59, 999); 

    const result = await Show.deleteMany({
      date: { $lte: nowUtc }
    });

    console.log(`Expired shows deleted successfully. Count: ${result.deletedCount}`);
  } catch (error) {
    console.error('Failed to delete expired shows:', error);
  }
}

cron.schedule('0 2 * * *', () => {
  console.log('Running scheduled task to delete expired shows based on UTC...');
  deleteExpiredShows();
}, {
  scheduled: true,
  timezone: "UTC"
});


connectDb().then(() => {
  console.log('Connected to database and waiting for scheduled tasks...');
}).catch(console.error);