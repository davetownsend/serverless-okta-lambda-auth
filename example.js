module.exports.getExample = async event => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Welcome! You are in!" })
    };
  } catch (err) {
    console.error(`Error: ${err}`);
    return new Error("Error");
  }
};
