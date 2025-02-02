"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@radix-ui/themes";
import { useRouter } from "next/navigation";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMessage, setModalMessage] = useState("");
	const router = useRouter();

	// Fetch user profile and store it in state
	const fetchUser = useCallback(async () => {
		const {
			data: { user: authUser },
		} = await supabase.auth.getUser();

		if (authUser) {
			// If user is logged in, fetch the user profile from the database
			const { data: profile, error } = await supabase
				.from("users")
				.select("*")
				.eq("id", authUser.id)
				.single();

			if (error) {
				router.push("/login");
				console.error("Error fetching profile:", error);
			} else {
				// If profile exists, set it in the context
				setUser({ ...profile });
			}
		} else {
			// No user logged in, set the user state to null
			setUser(null);
		}
	}, []);

	useEffect(() => {
		fetchUser();

		// Set up an auth listener to handle session changes
		const { data: listener } = supabase.auth.onAuthStateChange(() => {
			fetchUser();
		});

		// Cleanup the listener on component unmount
		return () => {
			listener.subscription.unsubscribe();
		};
	}, [fetchUser]);

	return (
		<UserContext.Provider value={{ user, setUser, fetchUser }}>
			{children}
			<Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
				<Dialog.Content
					className="max-w-[450px] p-8 rounded-md border-2 bg-white fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg z-50 text-center"
					style={{
						border: "1px solid var(--gray-6)",
					}}
				>
					<Dialog.Title className="text-lg font-semibold text-blue-500 mb-4">
						알림
					</Dialog.Title>
					<Dialog.Description className="text-base text-gray-700 mb-6">
						{modalMessage}
					</Dialog.Description>
					<Dialog.Close asChild>
						<Button
							variant="soft"
							color="blue"
							className="w-full py-2 rounded-md text-base font-medium"
							onClick={() => {
								setIsModalOpen(false);
								router.push("/");
							}}
						>
							확인
						</Button>
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Root>
		</UserContext.Provider>
	);
};

