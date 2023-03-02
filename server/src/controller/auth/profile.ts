import { RequestHandler } from 'express';
type ProfileHandler = RequestHandler;

const getProfile: ProfileHandler = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).send('not found');
    }

    res.status(200).json(user);
  } catch (e) {
    return res.status(500).send('something went wrong');
  }
};

export { getProfile };
