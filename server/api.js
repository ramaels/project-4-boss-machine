const express = require('express');
const morgan = require('morgan');
const {
  createMeeting,
  getAllFromDatabase,
  getFromDatabaseById,
  addToDatabase,
  updateInstanceInDatabase,
  deleteFromDatabasebyId,
  deleteAllFromDatabase,
  getFromWorkByMinionId,
} = require('./db');
const checkMillionDollarIdea = require('./checkMillionDollarIdea');

const apiRouter = express.Router();
const modelRouter = express.Router({ mergeParams: true });
const instanceRouter = express.Router({ mergeParams: true });

// Logging middleware
apiRouter.use(morgan('dev'));

// Validation rules for each model
const validationRules = {
  minions: {
    name: { type: 'string', required: true, message: 'Invalid name. ' },
    title: { type: 'string', required: true, message: 'Invalid title. ' },
    weaknesses: { type: 'string', required: true, message: 'Invalid weaknesses. ' },
    salary: { type: 'number', required: true, message: 'Invalid salary. ' },
  },
  ideas: {
    name: { type: 'string', required: true, message: 'Invalid name. ' },
    description: { type: 'string', required: true, message: 'Invalid description. ' },
    numWeeks: { type: 'number', required: true, message: 'Invalid number of weeks. ' },
    weeklyRevenue: { type: 'number', required: true, message: 'Invalid weekly revenue. ' },
  },
  work: {
    title: { type: 'string', required: true, message: 'Invalid name. ' },
    description: { type: 'string', required: true, message: 'Invalid description. ' },
    hours: { type: 'number', required: true, message: 'Invalid number of hours. ' },
  }
};

// Function to validate inputs
function validateInputs(model, data) {
  const rules = validationRules[model];

  if (!rules) {
    return { valid: false, errorMessage: 'Invalid model. ' };
  }

  let errorMessage = '';
  let valid = true;

  for (const key in rules) {
    const rule = rules[key];
    const value = data[key];

    if (key === 'name' && rule.required) {
      if (typeof value !== rule.type || (rule.type === 'string' && (value === undefined || value.trim() === ''))) {
        valid = false;
        errorMessage += rule.message;
      }
    } else if (rule.required) {
      if (typeof value !== rule.type) {
        valid = false;
        errorMessage += rule.message;
      }

      if (rule.type === 'number' && isNaN(Number(value))) {
        valid = false;
        errorMessage += rule.message;
      }
    }
  }

  return { valid, errorMessage };
}

// Middleware to handle 'model' parameter
apiRouter.param('model', (req, res, next, model) => {
  req.model = model;
  next();
});

// Route to handle '/:model'
apiRouter.get('/:model', (req, res, next) => {
  const receivedModel = getAllFromDatabase(req.model);
  if (!receivedModel) {
    return res.status(404).send('Model not found');
  }
  res.send(receivedModel);
});

apiRouter.post('/:model', (req, res, next) => {
  let instance = {};

  if (req.model !== 'meetings') {
    const checked = validateInputs(req.model, req.body);
    if (!checked.valid) {
      return res.status(404).send(checked.errorMessage);
    } else if (req.model === 'minions') {
      instance = { ...req.body, salary: Number(req.body.salary) };
    } else if (req.model === 'ideas') {
      instance = {
        ...req.body,
        numWeeks: Number(req.body.numWeeks),
        weeklyRevenue: Number(req.body.weeklyRevenue)
      };
      checkMillionDollarIdea(req, res, () => {
        const receivedItem = addToDatabase(req.model, instance);
        if (!receivedItem) {
          return res.status(404).send('Idea not created');
        }
        res.status(201).send(receivedItem);;
      });
      return; // Add this line to prevent further execution
    }
  } else {
    instance = createMeeting();
  }
  const receivedItem = addToDatabase(req.model, instance);
  if (!receivedItem) {
    return res.status(404).send('Item not created');
  }
  res.status(201).send(receivedItem);
});

apiRouter.delete('/:model', (req, res, next) => {
  if (req.model === 'meetings') {
    const deletedItems = deleteAllFromDatabase(req.model);
    if (!deletedItems) {
      return res.status(404).send('Items not deleted');
    }
    res.status(204).send(deletedItems);
  }
});

// Mount modelRouter on '/:model'
apiRouter.use('/:model', modelRouter);

// Middleware to handle 'itemId' parameter
modelRouter.param('itemId', (req, res, next, itemId) => {
  req.itemId = itemId;
  next();
});

// Routes to handle '/:model/:itemId'
modelRouter.get('/:itemId', (req, res, next) => {
  const receivedItem = getFromDatabaseById(req.model, req.itemId);
  if (!receivedItem) {
    return res.status(404).send('Item not found');
  }
  res.send(receivedItem);
});

modelRouter.put('/:itemId', (req, res, next) => {
  let instance = {};
  const checked = validateInputs(req.model, req.body);
  if (!checked.valid) {
    return res.status(404).send(checked.errorMessage);
  } else if (req.model === 'minions') {
    instance = { ...req.body, salary: Number(req.body.salary) };
  } else if (req.model === 'ideas') {
    instance = {
      ...req.body,
      numWeeks: Number(req.body.numWeeks),
      weeklyRevenue: Number(req.body.weeklyRevenue)
    };
    checkMillionDollarIdea(req, res, () => {
      const updatedItem = updateInstanceInDatabase(req.model, instance);
      if (!updatedItem) {
        return res.status(404).send('Item not created');
      }
      res.send(updatedItem);
    });
    return; // Add this line to prevent further execution
  }
  const updatedItem = updateInstanceInDatabase(req.model, instance);
  if (!updatedItem) {
    return res.status(404).send('Item not updated');
  }
  res.send(updatedItem);
});

modelRouter.delete('/:itemId', (req, res, next) => {
  const deleteditem = deleteFromDatabasebyId(req.model, req.itemId);
  if (!deleteditem) {
    return res.status(404).send('Item not deleted');
  }
  res.status(204).send(deleteditem);
});

// Mount instanceRouter on '/:model'
modelRouter.use('/:itemId', instanceRouter);

// Middleware to handle 'workId' parameter
instanceRouter.param('workId', (req, res, next, workId) => {
  req.workId = workId;
  next();
});

// Routes to handle '/:model/:itemId/work'
instanceRouter.get('/work', (req, res, next) => {
  const receivedAllWork = getFromWorkByMinionId(req.itemId);
  if (!receivedAllWork){
    return res.status(404).send('Works not found');
  }
  res.send(receivedAllWork);
});

instanceRouter.post('/work', (req, res, next) => {
  const instance = { ...req.body, hours: Number(req.body.hours) };
  const checked = validateInputs('work', instance);
  if (!checked.valid) {
    return res.status(404).send(checked.errorMessage);
  } else {
    instance.minionId = req.itemId;
    const newWork = addToDatabase('work', instance);
    if (!newWork) {
      return res.status(404).send('Work not created');
    }
    res.status(201).send(newWork);
  }
});

instanceRouter.put('/work/:workId', (req, res, next) => {
  const receivedWork = getFromDatabaseById('work', req.workId);
  if (!receivedWork) {
    return res.status(404).send('Item not found');
  }
  if (receivedWork.minionId !== req.itemId) {
    return res.status(400).send('Minion not found');
  }
  const instance = {
    ...req.body,
    id: req.workId,
    hours: Number(req.body.hours),
    minionId: req.itemId
  };
  const updatedWork = updateInstanceInDatabase('work', instance);
  if (!updatedWork){
    return res.status(404).send('Work not updated');
  }
  res.send(updatedWork);
});

instanceRouter.delete('/work/:workId', (req, res, next) => {
  const deletedWork = deleteFromDatabasebyId('work', req.workId);
  if (!deletedWork) {
    return res.status(404).send('Item not deleted');
  }
  res.status(204).send(deletedWork);

});

module.exports = apiRouter;
