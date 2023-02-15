import { RequestHandler } from 'express';
type ProfileHandler = RequestHandler;

const getProfile: ProfileHandler = async (req, res) => {
  try {
    const userId = req.session.cookie;
    console.log(userId);
  } catch (e) {}
};

export { getProfile };
