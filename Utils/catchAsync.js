module.exports = (functionToBeWrapped) => {
    const wrappingFunction = (req, res, next) => {
      functionToBeWrapped(req, res, next).catch(next);
    };
    return wrappingFunction;
  };
  