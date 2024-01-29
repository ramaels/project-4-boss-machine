const checkMillionDollarIdea = (req, res, next) => {
  const numWeeks = Number(req.body.numWeeks);
  const weeklyRevenue = Number(req.body.weeklyRevenue);
  if (isNaN(numWeeks) || isNaN(weeklyRevenue)) {
    return res.status(400).send();
  }
  if (numWeeks * weeklyRevenue < 1000000) {
    return res.status(400).send('Idea not worth a million dollars Idea!');
  }
  next();
};

// Leave this exports assignment so that the function can be used elsewhere
module.exports = checkMillionDollarIdea;
