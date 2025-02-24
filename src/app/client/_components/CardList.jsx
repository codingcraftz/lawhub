// src/app/client/_components/CardList.jsx

"use client";

import React from "react";

const CardList = ({ children }) => {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{children}
		</div>
	);
};

export default CardList;

