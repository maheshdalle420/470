import {
	Avatar,
	AvatarBadge,
	Box,
	Flex,
	Image,
	Stack,
	Text,
	WrapItem,
	useColorModeValue,
} from "@chakra-ui/react";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All } from "react-icons/bs";
import { selectedConversationAtom } from "../atoms/messagesAtom";

const Conversation = ({ conversation, isOnline }) => {
	const currentUser = useRecoilValue(userAtom);
	const lastMessage = conversation.lastMessage;
	const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);

	// Get the other participant in the conversation
	const user = conversation.participants.find(
		(participant) => participant._id !== currentUser._id
	);

	// Determine preview content: text or GIF
	let previewContent;
	if (lastMessage.type === "gif" && lastMessage.payload) {
		// Show a small GIF thumbnail
		previewContent = (
			<Image
				src={lastMessage.payload}
				alt="GIF preview"
				boxSize="24px"
				objectFit="cover"
				borderRadius="md"
			/>
		);
	} else {
		const text = lastMessage.text || "";
		previewContent = text.length > 18 ? text.substring(0, 18) + "..." : text;
	}

	// Check if the conversation is selected
	const isSelected = String(conversation._id) === String(selectedConversation?._id);

	return (
		<Flex
			gap={4}
			alignItems="center"
			p={2}
			_hover={{
				cursor: "pointer",
				bg: useColorModeValue("gray.100", "gray.700"),
				color: useColorModeValue("black", "white"),
			}}
			onClick={() =>
				setSelectedConversation({
					_id: conversation._id,
					userId: user._id,
					userProfilePic: user.profilePic,
					username: user.username,
					mock: conversation.mock,
				})
			}
			bg={isSelected ? useColorModeValue("gray.200", "gray.600") : "transparent"}
			borderRadius="md"
		>
			<WrapItem>
				<Avatar size={{ base: "xs", sm: "sm", md: "md" }} src={user.profilePic}>
					{isOnline && <AvatarBadge boxSize="1em" bg="green.500" />}
				</Avatar>
			</WrapItem>

			<Stack direction="column" fontSize="sm" spacing={0}>
				<Text fontWeight="700">{user.username}</Text>
				<Flex alignItems="center" fontSize="xs">
					{currentUser._id === lastMessage.sender && lastMessage.seen && (
						<BsCheck2All size={14} color={useColorModeValue("blue.500", "blue.300")} />
					)}
					<Box ml={currentUser._id === lastMessage.sender ? 1 : 0}>
						{previewContent}
					</Box>
				</Flex>
			</Stack>
		</Flex>
	);
};

export default Conversation;
