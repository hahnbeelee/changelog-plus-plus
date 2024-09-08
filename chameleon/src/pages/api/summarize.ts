import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    console.log(req.body);
    //TODO ADD CODE FROM HAN
    res.json('# THIS IS A TEST HEADER');
}