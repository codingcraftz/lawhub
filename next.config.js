const path = require("path");

module.exports = {
	reactStrictMode: false, // Disable React StrictMode
	webpack: (config) => {
		config.resolve.alias["@"] = path.resolve(__dirname, "src");
		return config;
	},
	images: {
		remotePatterns: [
			{
				protocol: 'http',
				hostname: 'k.kakaocdn.net',
				port: "", // 포트는 비워둡니다.
				pathname: "/**", // 모든 경로 허용
			},
		],
	},
};

