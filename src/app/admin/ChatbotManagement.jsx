"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";  // utils의 supabase 클라이언트 import
import {
  Button,
  Flex,
  Box,
  Text,
  Dialog,
  Switch,
  Card,
  IconButton,
  Badge,
} from "@radix-ui/themes";
import {
  DragHandleDots2Icon,
  PlusIcon,
  Cross2Icon,
  ChevronRightIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/** 메시지 유형을 정의 */
const MESSAGE_TYPES = [
  { id: "initial", label: "초기 메시지", color: "blue", icon: "💬" },
  { id: "text", label: "일반 텍스트", color: "green", icon: "📝" },
  { id: "button", label: "버튼 선택", color: "orange", icon: "🔘" },
  { id: "input", label: "사용자 입력", color: "purple", icon: "✏️" },
];

/** 입력 필드 유형 정의 */
const INPUT_TYPES = [
  { id: "text", label: "텍스트" },
  { id: "number", label: "숫자" },
  { id: "date", label: "날짜" },
  { id: "time", label: "시간" },
];

/** 시나리오 데이터 기본 형태 */
function createScenario({ title, description, isActive }) {
  return {
    id: Date.now(),
    title,
    description,
    is_active: isActive,
    messages: [],
  };
}

/** 메시지 데이터 기본 형태 */
function createMessage({
  messageType,
  responseText,
  triggerText,
  buttonOptions,
  inputField,
  sortOrder,
}) {
  return {
    id: Date.now().toString(),
    message_type: messageType,
    response_text: responseText,
    trigger_text: triggerText,
    sort_order: sortOrder,
    button_options: buttonOptions,
    input_field: messageType === "input" ? inputField : null,
  };
}

/** 드래그 가능한 메시지 아이템 컴포넌트 */
function SortableMessageItem({ message, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: message.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const messageType = MESSAGE_TYPES.find(type => type.id === message.messageType);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-3 hover:shadow-md transition-shadow"
    >
      <Box className="p-4">
        <Flex align="center" gap="3">
          <Box {...attributes} {...listeners} style={{ cursor: "grab" }}>
            <DragHandleDots2Icon />
          </Box>
          
          <Box className="flex-1">
            <Flex align="center" gap="2" mb="2">
              <Text size="2" className="flex items-center gap-1">
                <span>{messageType.icon}</span>
                <span style={{ 
                  color: `var(--${messageType.color}-9)`,
                  fontWeight: "bold" 
                }}>
                  {messageType.label}
                </span>
              </Text>
            </Flex>
            
            <Box className="bg-gray-1 p-3 rounded-lg mb-2">
              <Text size="2">{message.responseText}</Text>
            </Box>
            
            {message.buttonOptions?.length > 0 && (
              <Flex gap="2" mt="2" wrap="wrap">
                {message.buttonOptions.map((opt, idx) => (
                  <Button key={idx} size="1" variant="soft">
                    {opt.text}
                  </Button>
                ))}
              </Flex>
            )}

            {message.messageType === "input" && message.inputField && (
              <Box className="mt-2 p-2 bg-gray-2 rounded-lg">
                <Text size="2" weight="bold">입력 필드 설정</Text>
                <Flex gap="2" mt="1">
                  <Badge variant="soft" color="purple">
                    {INPUT_TYPES.find(t => t.id === message.inputField.type)?.label || "텍스트"}
                  </Badge>
                  {message.inputField.required && (
                    <Badge variant="soft" color="red">필수</Badge>
                  )}
                </Flex>
                {message.inputField.placeholder && (
                  <Text size="1" color="gray" mt="1">
                    안내문구: {message.inputField.placeholder}
                  </Text>
                )}
              </Box>
            )}
          </Box>

          <Flex direction="column" gap="2">
            <IconButton size="1" variant="soft" onClick={() => onEdit(message)}>
              <Pencil1Icon />
            </IconButton>
            <IconButton 
              size="1" 
              variant="soft" 
              color="red" 
              onClick={() => onDelete(message.id)}
            >
              <Cross2Icon />
            </IconButton>
          </Flex>
        </Flex>
      </Box>
    </Card>
  );
}

/** 시나리오 폼 다이얼로그 */
function ScenarioFormDialog({ open, onClose, onSubmit, scenarioToEdit }) {
  const isEdit = !!scenarioToEdit;
  
  const [title, setTitle] = useState(scenarioToEdit?.title || "");
  const [description, setDescription] = useState(scenarioToEdit?.description || "");
  const [isActive, setIsActive] = useState(scenarioToEdit?.isActive ?? true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, description, isActive });
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content>
        <Dialog.Title>{isEdit ? "시나리오 수정" : "새 시나리오 추가"}</Dialog.Title>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Box>
            <Text as="label" size="2">시나리오 제목</Text>
            <input
              className="w-full mt-1 p-2 rounded border border-gray-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 의뢰하기 플로우"
              required
            />
          </Box>
          <Box>
            <Text as="label" size="2">설명</Text>
            <textarea
              className="w-full mt-1 p-2 rounded border border-gray-200"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 고객이 의뢰 버튼을 눌렀을 때 진행되는 흐름"
              rows={3}
            />
          </Box>
          <Flex align="center" gap="2">
            <Text as="label" size="2">활성화</Text>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </Flex>
          <Flex justify="end" gap="2">
            <Button variant="soft" color="gray" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">
              {isEdit ? "저장" : "추가"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

/** 메시지 폼 다이얼로그 */
function MessageFormDialog({
  open,
  onClose,
  onSubmit,
  messageToEdit,
}) {
  const isEdit = !!messageToEdit;

  const [messageType, setMessageType] = useState(
    messageToEdit?.messageType || "initial"
  );
  const [responseText, setResponseText] = useState(
    messageToEdit?.responseText || ""
  );
  const [triggerText, setTriggerText] = useState(
    messageToEdit?.triggerText || []
  );
  const [buttonOptions, setButtonOptions] = useState(
    messageToEdit?.buttonOptions || []
  );
  const [inputField, setInputField] = useState(
    messageToEdit?.inputField || {
      type: "text",
      required: false,
      placeholder: "",
      validation: null,
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      messageType,
      responseText,
      triggerText,
      buttonOptions,
      inputField,
    });
    onClose();
  };

  const addButtonOption = () => {
    setButtonOptions([...buttonOptions, { text: "", value: "" }]);
  };

  const updateButtonOption = (index, key, value) => {
    const newOptions = [...buttonOptions];
    newOptions[index] = {
      ...newOptions[index],
      [key]: value,
    };
    setButtonOptions(newOptions);
  };

  const removeButtonOption = (index) => {
    setButtonOptions(buttonOptions.filter((_, i) => i !== index));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: "600px" }}>
        <Dialog.Title>
          {isEdit ? "메시지 수정" : "새 메시지 추가"}
        </Dialog.Title>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Box>
            <Text as="label" size="2" weight="bold">메시지 유형</Text>
            <Flex gap="2" mt="2">
              {MESSAGE_TYPES.map((type) => (
                <Button
                  key={type.id}
                  size="2"
                  type="button"
                  variant={messageType === type.id ? "solid" : "soft"}
                  onClick={(e) => {
                    e.preventDefault();
                    setMessageType(type.id);
                  }}
                  style={messageType === type.id ? {
                    backgroundColor: `var(--${type.color}-9)`,
                    color: 'white'
                  } : {}}
                >
                  <span>{type.icon}</span>
                  <span className="ml-1">{type.label}</span>
                </Button>
              ))}
            </Flex>
          </Box>

          <Box>
            <Text as="label" size="2" weight="bold">메시지 내용</Text>
            <textarea
              className="w-full mt-1 p-3 rounded-lg border border-gray-200"
              rows={3}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="챗봇이 출력할 메시지를 입력하세요"
              required
            />
          </Box>

          {messageType === "text" && (
            <Box>
              <Text as="label" size="2" weight="bold">트리거 키워드</Text>
              <input
                className="w-full mt-1 p-3 rounded-lg border border-gray-200"
                value={triggerText.join(", ")}
                onChange={(e) =>
                  setTriggerText(
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="쉼표(,)로 구분하여 입력"
              />
              <Text size="1" color="gray">
                사용자가 입력한 내용에 이 키워드가 포함되면 이 메시지가 출력됩니다
              </Text>
            </Box>
          )}

          {messageType === "button" && (
            <Box>
              <Flex justify="between" align="center" mb="2">
                <Text as="label" size="2" weight="bold">버튼 옵션</Text>
                <Button 
                  size="1" 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    addButtonOption();
                  }}
                >
                  <PlusIcon /> 버튼 추가
                </Button>
              </Flex>
              <Box className="space-y-2">
                {buttonOptions.map((opt, index) => (
                  <Card key={index} className="p-3">
                    <Flex justify="between" align="start" gap="2">
                      <Box className="flex-1 space-y-2">
                        <input
                          className="w-full p-2 rounded-lg border border-gray-200"
                          value={opt.text}
                          onChange={(e) =>
                            updateButtonOption(index, "text", e.target.value)
                          }
                          placeholder="버튼에 표시될 텍스트"
                        />
                        <input
                          className="w-full p-2 rounded-lg border border-gray-200"
                          value={opt.value}
                          onChange={(e) =>
                            updateButtonOption(index, "value", e.target.value)
                          }
                          placeholder="버튼 선택 시의 값"
                        />
                      </Box>
                      <IconButton
                        size="1"
                        variant="soft"
                        color="red"
                        onClick={() => removeButtonOption(index)}
                      >
                        <Cross2Icon />
                      </IconButton>
                    </Flex>
                  </Card>
                ))}
                {buttonOptions.length === 0 && (
                  <Text size="2" color="gray" align="center">
                    버튼을 추가해주세요
                  </Text>
                )}
              </Box>
            </Box>
          )}

          {messageType === "input" && (
            <Box>
              <Text as="label" size="2" weight="bold">입력 필드 설정</Text>
              <Card className="p-4 mt-2">
                <Flex direction="column" gap="3">
                  <Box>
                    <Text as="label" size="2">입력 유형</Text>
                    <select
                      className="w-full mt-1 p-2 rounded-lg border border-gray-200"
                      value={inputField.type}
                      onChange={(e) => setInputField({
                        ...inputField,
                        type: e.target.value
                      })}
                    >
                      {INPUT_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </Box>
                  
                  <Box>
                    <Text as="label" size="2">안내 문구</Text>
                    <input
                      className="w-full mt-1 p-2 rounded-lg border border-gray-200"
                      value={inputField.placeholder}
                      onChange={(e) => setInputField({
                        ...inputField,
                        placeholder: e.target.value
                      })}
                      placeholder="예: 피해 금액을 입력해주세요"
                    />
                  </Box>

                  <Flex align="center" gap="2">
                    <Switch
                      checked={inputField.required}
                      onCheckedChange={(checked) => setInputField({
                        ...inputField,
                        required: checked
                      })}
                    />
                    <Text size="2">필수 입력</Text>
                  </Flex>
                </Flex>
              </Card>
            </Box>
          )}

          <Flex justify="end" gap="2">
            <Button variant="soft" color="gray" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">
              {isEdit ? "저장" : "추가"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

/** 메인 컴포넌트 */
export default function ChatbotManagement() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [showScenarioDialog, setShowScenarioDialog] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  // DnD 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 시나리오 목록 로드
  useEffect(() => {
    loadScenarios();
  }, []);

  // 시나리오 로드 함수
  const loadScenarios = async () => {
    try {
      setIsLoading(true);
      
      // 시나리오 로드
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('chatbot_scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (scenariosError) throw scenariosError;

      // 각 시나리오의 메시지 로드
      const scenariosWithMessages = await Promise.all(
        scenariosData.map(async (scenario) => {
          // 메시지 로드
          const { data: messagesData, error: messagesError } = await supabase
            .from('chatbot_messages')
            .select(`
              *,
              button_options:chatbot_button_options(*),
              input_field:chatbot_input_fields(*)
            `)
            .eq('scenario_id', scenario.id)
            .order('sort_order');

          if (messagesError) throw messagesError;

          return {
            ...scenario,
            messages: messagesData.map(msg => ({
              ...msg,
              messageType: msg.message_type,
              responseText: msg.response_text,
              triggerText: msg.trigger_text || [],
              buttonOptions: msg.button_options || [],
              inputField: msg.input_field?.[0] || null,
            })),
          };
        })
      );

      setScenarios(scenariosWithMessages);
    } catch (error) {
      console.error('Error loading scenarios:', error);
      alert('시나리오 로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 시나리오 추가/수정
  const handleSubmitScenario = async (data) => {
    try {
      if (editingScenario) {
        // 시나리오 수정
        const { error } = await supabase
          .from('chatbot_scenarios')
          .update({
            title: data.title,
            description: data.description,
            is_active: data.isActive,
          })
          .eq('id', editingScenario.id);

        if (error) throw error;
      } else {
        // 시나리오 추가
        const { error } = await supabase
          .from('chatbot_scenarios')
          .insert({
            id: Date.now(),
            title: data.title,
            description: data.description,
            is_active: data.isActive,
          });

        if (error) throw error;
      }

      await loadScenarios();
      setShowScenarioDialog(false);
    } catch (error) {
      console.error('Error saving scenario:', error);
      alert('시나리오 저장 중 오류가 발생했습니다.');
    }
  };

  // 시나리오 삭제
  const handleDeleteScenario = async (scenarioId) => {
    if (!confirm("이 시나리오를 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from('chatbot_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) throw error;

      await loadScenarios();
      if (selectedScenarioId === scenarioId) {
        setSelectedScenarioId(null);
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
      alert('시나리오 삭제 중 오류가 발생했습니다.');
    }
  };

  // 메시지 추가/수정
  const handleSubmitMessage = async (messageData) => {
    if (!selectedScenario) return;

    try {
      const messageId = editingMessage?.id || Math.floor(Date.now());
      const sortOrder = editingMessage?.sort_order || selectedScenario.messages.length;

      let finalMessageId = messageId;

      if (editingMessage) {
        // 메시지 수정
        const { error: messageError } = await supabase
          .from('chatbot_messages')
          .update({
            message_type: messageData.messageType,
            response_text: messageData.responseText,
            trigger_text: messageData.triggerText,
            sort_order: sortOrder,
          })
          .eq('id', messageId);

        if (messageError) throw messageError;
      } else {
        // 메시지 추가
        const { data: insertedMessage, error: messageError } = await supabase
          .from('chatbot_messages')
          .insert({
            id: messageId,
            scenario_id: selectedScenario.id,
            message_type: messageData.messageType,
            response_text: messageData.responseText,
            trigger_text: messageData.triggerText,
            sort_order: sortOrder,
          })
          .select()
          .single();

        if (messageError) throw messageError;
        finalMessageId = insertedMessage.id;
      }

      // 버튼 옵션 처리
      if (messageData.messageType === 'button') {
        await supabase
          .from('chatbot_button_options')
          .delete()
          .eq('message_id', finalMessageId);

        if (messageData.buttonOptions?.length > 0) {
          const { error: buttonError } = await supabase
            .from('chatbot_button_options')
            .insert(
              messageData.buttonOptions.map((opt) => ({
                id: Math.floor(Date.now() + Math.random() * 1000),
                message_id: finalMessageId,
                text: opt.text,
                value: opt.value,
              }))
            );

          if (buttonError) throw buttonError;
        }
      }

      // 입력 필드 처리
      if (messageData.messageType === 'input') {
        await supabase
          .from('chatbot_input_fields')
          .delete()
          .eq('message_id', finalMessageId);

        if (messageData.inputField) {
          const { error: inputError } = await supabase
            .from('chatbot_input_fields')
            .insert({
              id: Math.floor(Date.now()),
              message_id: finalMessageId,
              input_type: messageData.inputField.type,
              placeholder: messageData.inputField.placeholder,
              is_required: messageData.inputField.required,
            });

          if (inputError) throw inputError;
        }
      }

      await loadScenarios();
      setShowMessageDialog(false);
    } catch (error) {
      console.error('Error saving message:', error);
      alert('메시지 저장 중 오류가 발생했습니다.');
    }
  };

  // 메시지 삭제
  const handleDeleteMessage = async (msgId) => {
    if (!confirm("이 메시지를 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from('chatbot_messages')
        .delete()
        .eq('id', msgId);

      if (error) throw error;

      await loadScenarios();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('메시지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 메시지 순서 변경
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      try {
        const oldScenario = scenarios.find((s) => s.id === selectedScenarioId);
        const oldMessages = [...oldScenario.messages];
        
        const oldIndex = oldMessages.findIndex((m) => m.id === active.id);
        const newIndex = oldMessages.findIndex((m) => m.id === over.id);
        
        const newMessages = arrayMove(oldMessages, oldIndex, newIndex);
        
        // 순서 업데이트를 데이터베이스에 반영
        const updates = newMessages.map((msg, index) => ({
          id: msg.id,
          scenario_id: selectedScenario.id,
          message_type: msg.message_type,
          response_text: msg.response_text,
          trigger_text: msg.trigger_text || [],
          sort_order: index,
        }));

        const { error } = await supabase
          .from('chatbot_messages')
          .upsert(updates);

        if (error) throw error;

        // 로컬 상태 업데이트
        setScenarios(scenarios.map(s => 
          s.id === selectedScenarioId 
            ? { ...s, messages: newMessages }
            : s
        ));
      } catch (error) {
        console.error('Error updating message order:', error);
        alert('메시지 순서 변경 중 오류가 발생했습니다.');
      }
    }
  };

  if (isLoading) {
    return (
      <Box className="p-6 max-w-[1200px] mx-auto">
        <Text>로딩 중...</Text>
      </Box>
    );
  }

  return (
    <Box className="p-6 max-w-[1200px] mx-auto">
      <Flex justify="between" align="center" className="mb-6">
        <Text size="6" weight="bold">
          챗봇 시나리오 관리
        </Text>
        <Button onClick={() => setShowScenarioDialog(true)}>
          <PlusIcon /> 새 시나리오
        </Button>
      </Flex>

      <Flex gap="6">
        {/* 시나리오 목록 */}
        <Box className="w-1/3">
          <Text size="3" weight="bold" className="mb-3">
            시나리오 목록
          </Text>
          <Box className="space-y-2">
            {scenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className={`
                  cursor-pointer transition-all
                  ${scenario.id === selectedScenarioId ? 'ring-2 ring-blue-500' : ''}
                  hover:shadow-md
                `}
                onClick={() => setSelectedScenarioId(scenario.id)}
              >
                <Box p="3">
                  <Flex justify="between" align="start">
                    <Box>
                      <Text weight="bold">{scenario.title}</Text>
                      {scenario.description && (
                        <Text size="2" color="gray">
                          {scenario.description}
                        </Text>
                      )}
                      <Badge
                        size="1"
                        color={scenario.isActive ? "green" : "red"}
                        className="mt-2"
                      >
                        {scenario.isActive ? "활성" : "비활성"}
                      </Badge>
                    </Box>
                    <Flex gap="2">
                      <Button
                      size="1"
                        variant="soft"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingScenario(scenario);
                          setShowScenarioDialog(true);
                        }}
                      >
                        수정
                      </Button>
                      <IconButton
                        size="1"
                        variant="soft"
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScenario(scenario.id);
                        }}
                      >
                        <Cross2Icon />
                      </IconButton>
                    </Flex>
                  </Flex>
                  <Flex align="center" gap="1" mt="2">
                    <Text size="1" color="gray">
                      메시지 {scenario.messages.length}개
                    </Text>
                    <ChevronRightIcon />
                  </Flex>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>

        {/* 메시지 목록 */}
        {selectedScenario ? (
          <Box className="w-2/3">
            <Flex justify="between" align="center" className="mb-4">
              <Box>
                <Text size="3" weight="bold">
                  {selectedScenario.title}
                </Text>
                <Text size="2" color="gray">
                  메시지를 드래그하여 순서를 변경할 수 있습니다
                </Text>
              </Box>
              <Button onClick={() => setShowMessageDialog(true)}>
                <PlusIcon /> 메시지 추가
              </Button>
            </Flex>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedScenario.messages.map(m => m.id)}
                strategy={verticalListSortingStrategy}
              >
                {selectedScenario.messages.map((message) => (
                  <SortableMessageItem
                    key={message.id}
                    message={message}
                    onEdit={(msg) => {
                      setEditingMessage(msg);
                      setShowMessageDialog(true);
                    }}
                    onDelete={(msgId) => handleDeleteMessage(msgId)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </Box>
        ) : (
          <Box className="w-2/3 flex items-center justify-center">
            <Text size="3" color="gray">
              ← 시나리오를 선택해주세요
            </Text>
          </Box>
        )}
      </Flex>

      {showScenarioDialog && (
        <ScenarioFormDialog
          open={showScenarioDialog}
          onClose={() => setShowScenarioDialog(false)}
          onSubmit={handleSubmitScenario}
          scenarioToEdit={editingScenario}
        />
      )}

      {showMessageDialog && selectedScenario && (
        <MessageFormDialog
          open={showMessageDialog}
          onClose={() => setShowMessageDialog(false)}
          onSubmit={handleSubmitMessage}
          messageToEdit={editingMessage}
        />
      )}
    </Box>
  );
}
