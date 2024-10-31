// src/app/todos/TodoList.jsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Text, Flex, Button } from "@radix-ui/themes";
import TodoForm from "./TodoForm";

const priorityColors = {
  높음: "var(--red-5)",
  중간: "var(--green-5)",
  낮음: "var(--gray-5)",
};

const TodoList = () => {
  const [columns, setColumns] = useState({
    todo: { title: "할 일", items: [] },
    doing: { title: "진행 중", items: [] },
    done: { title: "완료", items: [] },
  });
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState("중간");
  const [editingTodo, setEditingTodo] = useState(null); // 편집할 todo 상태 추가
  const { user } = useUser();

  const [showFullTextState, setShowFullTextState] = useState({});

  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("position");

      if (error) throw error;

      const newColumns = {
        todo: { title: "할 일", items: [] },
        doing: { title: "진행 중", items: [] },
        done: { title: "완료", items: [] },
      };
      data.forEach((todo) => {
        newColumns[todo.status].items.push(todo);
      });
      setColumns(newColumns);
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    const { data, error } = await supabase
      .from("todos")
      .insert({
        title: newTodo,
        user_id: user.id,
        status: "todo",
        position: columns.todo.items.length,
        priority: priority,
      })
      .select();

    if (error) {
      console.error("Error adding todo:", error);
    } else {
      setNewTodo("");
      setPriority("중간");
      fetchTodos();
    }
  };

  const deleteTodo = async (id) => {
    if (window.confirm("정말로 이 항목을 삭제하시겠습니까?")) {
      const { error } = await supabase.from("todos").delete().eq("id", id);

      if (error) {
        console.error("Error deleting todo:", error);
      } else {
        fetchTodos();
      }
    }
  };

  const updateTodo = async (todo) => {
    // Exclude 'isEditing' from the update
    const { isEditing, ...updateData } = todo;

    const { error } = await supabase
      .from("todos")
      .update(updateData)
      .eq("id", todo.id);

    if (error) {
      console.error("Error updating todo:", error);
    } else {
      fetchTodos();
    }
  };

  // "더보기" 상태 토글 함수
  const toggleShowFullText = (id) => {
    setShowFullTextState((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceItems = Array.from(sourceColumn.items);
    const destItems =
      source.droppableId === destination.droppableId
        ? sourceItems
        : Array.from(destColumn.items);

    const [movedItem] = sourceItems.splice(source.index, 1);

    movedItem.status = destination.droppableId;

    destItems.splice(destination.index, 0, movedItem);

    const newColumns = {
      ...columns,
      [source.droppableId]: {
        ...sourceColumn,
        items:
          source.droppableId === destination.droppableId
            ? destItems
            : sourceItems,
      },
      [destination.droppableId]:
        source.droppableId === destination.droppableId
          ? destColumn
          : {
              ...destColumn,
              items: destItems,
            },
    };

    setColumns(newColumns);

    try {
      const { error } = await supabase
        .from("todos")
        .update({
          status: movedItem.status,
          position: destination.index,
        })
        .eq("id", movedItem.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating todo:", error);
      fetchTodos();
    }
  };

  return (
    <>
      <Flex justify="between" align="center" className="mb-4 mt-6">
        <Text size="8" weight="bold">
          할 일 관리
        </Text>
      </Flex>
      <div className="flex mb-4 items-center gap-2">
        <input
          placeholder="새로운 할 일 추가"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          className="flex-grow p-2 border rounded"
          style={{
            backgroundColor: "var(--gray-2)",
            border: "1px solid var(--gray-6)",
          }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-32 p-2 rounded"
          style={{
            backgroundColor: "var(--gray-2)",
            border: "1px solid var(--gray-6)",
          }}
        >
          <option value="높음">높음</option>
          <option value="중간">중간</option>
          <option value="낮음">낮음</option>
        </select>
        <Button onClick={addTodo}>추가</Button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4">
          {Object.entries(columns).map(([columnId, column]) => (
            <div key={columnId} className="flex-grow min-w-[250px]">
              <Text size="6" weight="bold" mb="2">
                {column.title}
              </Text>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="min-h-[300px] p-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: snapshot.isDraggingOver
                        ? "var(--gray-5)"
                        : "var(--gray-3)",
                    }}
                  >
                    {column.items.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="user-select-none p-4 mb-2 rounded shadow flex justify-between items-center"
                            style={{
                              backgroundColor: priorityColors[item.priority],
                              opacity: snapshot.isDragging ? 0.8 : 1,
                              ...provided.draggableProps.style,
                            }}
                          >
                            <Flex gap="2" justify="between" width="100%">
                              <Flex direction="column" className="flex-1">
                                <Flex>
                                  <Text
                                    size="5"
                                    weight="bold"
                                    style={{
                                      whiteSpace: showFullTextState[item.id]
                                        ? "normal"
                                        : "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: showFullTextState[item.id]
                                        ? "100%"
                                        : "200px",
                                    }}
                                  >
                                    {item.title}
                                  </Text>
                                  {item.title.length > 20 && (
                                    <Button
                                      variant="ghost"
                                      color="blue"
                                      onClick={() =>
                                        toggleShowFullText(item.id)
                                      }
                                      size="small"
                                    >
                                      {showFullTextState[item.id]
                                        ? "간략히"
                                        : "...더보기"}
                                    </Button>
                                  )}
                                </Flex>
                                <Text size="3" color="gray">
                                  우선순위: {item.priority}
                                </Text>
                              </Flex>
                              <Flex gap="0.5rem">
                                <Button
                                  variant="ghost"
                                  onClick={() => setEditingTodo(item)} // 편집할 항목 설정
                                >
                                  편집
                                </Button>

                                <Button
                                  variant="ghost"
                                  onClick={() => deleteTodo(item.id)}
                                >
                                  삭제
                                </Button>
                              </Flex>
                            </Flex>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
        {editingTodo && (
          <TodoForm
            todo={editingTodo}
            onSave={() => {
              fetchTodos(); // 데이터 업데이트
              setEditingTodo(null); // 다이얼로그 닫기
            }}
            onClose={() => setEditingTodo(null)} // 다이얼로그 닫기
          />
        )}
      </DragDropContext>
    </>
  );
};

export default TodoList;
