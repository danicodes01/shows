import Show from '../../../models/show-model'

async function handler(req, res) {
  const showId = req.query.showId;

  if (req.method === 'GET') {
    try {
      const document = await Show.findById(showId);

      if (document) {
        res.status(200).json({ show: document });
      } else {
        res.status(404).json({ message: 'Show not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error fetching the show' });
    }
  }
}

export default handler;
