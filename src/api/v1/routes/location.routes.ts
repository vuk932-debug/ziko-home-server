import { Router } from 'express';
import * as locationController from '../controllers/location.controller';

const router = Router();

router.get('/countries', locationController.getCountries);
router.get('/states', locationController.getStates);
router.get('/cities', locationController.getCities);

export default router;
