module.exports = {
   currentYearRSS() {
    const today = new Date();
    const year  = today.getFullYear();
    const dash  = `–`;
    if (year > 2012) {
      return dash + year;
    } else {
      return;
    }
  },
};
