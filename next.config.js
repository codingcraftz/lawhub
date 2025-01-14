const path = require("path");

module.exports = {
	reactStrictMode: false, // Disable React StrictMode
	webpack: (config) => {
		config.resolve.alias["@"] = path.resolve(__dirname, "src");
		return config;
	},
};

