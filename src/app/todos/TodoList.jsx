"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useUser } from "@/hooks/useUser";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Text, Flex, Button } from "@radix-ui/themes";

const priorityColors = {
  높음: "var(--tomato-4)",
  중간: "var(--sky-3)",
  낮음: "var(--gray-3)",
};

const TodoList = () => {
  const [columns, setColumns] = useState({
    todo: { title: "할 일", items: [] },
    doing: { title: "진행 중", items: [] },
    done: { title: "완료", items: [] },
  });
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState("중간");
  const { user } = useUser();

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
    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) {
      console.error("Error deleting todo:", error);
    } else {
      fetchTodos();
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
      {/* 할 일 관리 */}
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
          className="flex-grow p-2 border border-gray-7 rounded"
          style={{ backgroundColor: "var(--gray-2)" }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-32 p-2 border border-gray-7 rounded"
          style={{ backgroundColor: "var(--gray-2)" }}
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
                        ? "var(--gray-3)"
                        : "var(--gray-1)",
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
                            className="user-select-none p-4 mb-2 rounded shadow"
                            style={{
                              backgroundColor: priorityColors[item.priority],
                              opacity: snapshot.isDragging ? 0.8 : 1,
                              ...provided.draggableProps.style,
                            }}
                          >
                            <Flex justify="between" align="center">
                              <div>
                                <Text size="5" weight="bold">
                                  {item.title}
                                </Text>
                                <Text size="3" color="gray">
                                  우선순위: {item.priority}
                                </Text>
                              </div>
                              <Flex gap="2">
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    // Set isEditing to true
                                    setColumns((prevColumns) => {
                                      const newColumns = { ...prevColumns };
                                      Object.keys(newColumns).forEach(
                                        (colId) => {
                                          newColumns[colId].items = newColumns[
                                            colId
                                          ].items.map((i) =>
                                            i.id === item.id
                                              ? { ...i, isEditing: true }
                                              : i,
                                          );
                                        },
                                      );
                                      return newColumns;
                                    });
                                  }}
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
                            {item.isEditing && (
                              <div className="mt-2">
                                <input
                                  value={item.title}
                                  onChange={(e) => {
                                    const newTitle = e.target.value;
                                    setColumns((prevColumns) => {
                                      const newColumns = { ...prevColumns };
                                      Object.keys(newColumns).forEach(
                                        (colId) => {
                                          newColumns[colId].items = newColumns[
                                            colId
                                          ].items.map((i) =>
                                            i.id === item.id
                                              ? { ...i, title: newTitle }
                                              : i,
                                          );
                                        },
                                      );
                                      return newColumns;
                                    });
                                  }}
                                  className="w-full p-2 border border-gray-7 rounded mb-2"
                                  style={{ backgroundColor: "var(--gray-2)" }}
                                />
                                <select
                                  value={item.priority}
                                  onChange={(e) => {
                                    const newPriority = e.target.value;
                                    setColumns((prevColumns) => {
                                      const newColumns = { ...prevColumns };
                                      Object.keys(newColumns).forEach(
                                        (colId) => {
                                          newColumns[colId].items = newColumns[
                                            colId
                                          ].items.map((i) =>
                                            i.id === item.id
                                              ? {
                                                  ...i,
                                                  priority: newPriority,
                                                }
                                              : i,
                                          );
                                        },
                                      );
                                      return newColumns;
                                    });
                                  }}
                                  className="w-full p-2 border border-gray-7 rounded mb-2"
                                  style={{ backgroundColor: "var(--gray-2)" }}
                                >
                                  <option value="높음">높음</option>
                                  <option value="중간">중간</option>
                                  <option value="낮음">낮음</option>
                                </select>
                                <Flex gap="2" mt="2">
                                  <Button
                                    onClick={() => {
                                      // Create a copy of item without 'isEditing'
                                      const updatedItem = { ...item };
                                      delete updatedItem.isEditing;

                                      updateTodo(updatedItem);

                                      setColumns((prevColumns) => {
                                        const newColumns = { ...prevColumns };
                                        Object.keys(newColumns).forEach(
                                          (colId) => {
                                            newColumns[colId].items =
                                              newColumns[colId].items.map(
                                                (i) =>
                                                  i.id === item.id
                                                    ? { ...i, isEditing: false }
                                                    : i,
                                              );
                                          },
                                        );
                                        return newColumns;
                                      });
                                    }}
                                  >
                                    저장
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      // Cancel editing
                                      setColumns((prevColumns) => {
                                        const newColumns = { ...prevColumns };
                                        Object.keys(newColumns).forEach(
                                          (colId) => {
                                            newColumns[colId].items =
                                              newColumns[colId].items.map(
                                                (i) =>
                                                  i.id === item.id
                                                    ? { ...i, isEditing: false }
                                                    : i,
                                              );
                                          },
                                        );
                                        return newColumns;
                                      });
                                    }}
                                  >
                                    취소
                                  </Button>
                                </Flex>
                              </div>
                            )}
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
      </DragDropContext>
    </>
  );
};

export default TodoList;
