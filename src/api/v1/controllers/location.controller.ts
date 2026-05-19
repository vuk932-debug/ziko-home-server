import { Request, Response } from 'express';
import * as locationRepo from '../repositories/location.repository';

export const getCountries = async (req: Request, res: Response) => {
  try {
    const countries = await locationRepo.getAllCountries();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching countries', error });
  }
};

export const getStates = async (req: Request, res: Response) => {
  try {
    const { countryId } = req.query;
    if (!countryId) {
      return res.status(400).json({ message: 'countryId is required' });
    }
    const states = await locationRepo.getStatesByCountry(countryId as string);
    res.json(states);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching states', error });
  }
};

export const getCities = async (req: Request, res: Response) => {
  try {
    const { stateId } = req.query;
    if (!stateId) {
      return res.status(400).json({ message: 'stateId is required' });
    }
    const cities = await locationRepo.getCitiesByState(stateId as string);
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cities', error });
  }
};
