import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const TaskManager = ({ tasks, onTasksChange }) => {
  const handleTaskChange = (taskIndex, field, value) => {
    const newTasks = [...tasks];
    newTasks[taskIndex] = { ...newTasks[taskIndex], [field]: value };
    onTasksChange(newTasks);
  };

  const addTask = () => {
    const newTask = {
      name: "",
      description: "",
      endpoint: "",
      params_schema: { type: "object", properties: {}, required: [] },
    };
    onTasksChange([...(tasks || []), newTask]);
  };

  const removeTask = (index) => {
    onTasksChange(tasks.filter((_, i) => i !== index));
  };

  const addParameter = (taskIndex) => {
    const newTasks = JSON.parse(JSON.stringify(tasks));
    const newParamName = `param${
      Object.keys(newTasks[taskIndex].params_schema.properties).length + 1
    }`;
    newTasks[taskIndex].params_schema.properties[newParamName] = {
      type: "string",
      description: "",
    };
    onTasksChange(newTasks);
  };

  const removeParameter = (taskIndex, paramName) => {
    const newTasks = JSON.parse(JSON.stringify(tasks));
    delete newTasks[taskIndex].params_schema.properties[paramName];
    newTasks[taskIndex].params_schema.required =
      newTasks[taskIndex].params_schema.required.filter((p) => p !== paramName);
    onTasksChange(newTasks);
  };

  const handleParamChange = (
    taskIndex,
    oldParamName,
    newParamName,
    field,
    value
  ) => {
    const newTasks = JSON.parse(JSON.stringify(tasks));
    const { properties, required } = newTasks[taskIndex].params_schema;
    const paramData = properties[oldParamName];

    if (field === "name") {
      delete properties[oldParamName];
      properties[newParamName] = paramData;
      if (required.includes(oldParamName)) {
        newTasks[taskIndex].params_schema.required = required.map((p) =>
          p === oldParamName ? newParamName : p
        );
      }
    } else {
      properties[oldParamName][field] = value;
    }
    onTasksChange(newTasks);
  };

  const handleRequiredChange = (taskIndex, paramName, isChecked) => {
    const newTasks = JSON.parse(JSON.stringify(tasks));
    const { required } = newTasks[taskIndex].params_schema;
    if (isChecked && !required.includes(paramName)) required.push(paramName);
    else if (!isChecked)
      newTasks[taskIndex].params_schema.required = required.filter(
        (p) => p !== paramName
      );
    onTasksChange(newTasks);
  };

  return (
    <div className="space-y-4">
      {(tasks || []).map((task, taskIndex) => (
        <Card
          key={taskIndex}
          className="border-border bg-muted/30 overflow-hidden"
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tool {taskIndex + 1}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTask(taskIndex)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Tool details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor={`task-name-${taskIndex}`}
                  className="text-sm"
                >
                  Function Name
                </Label>
                <Input
                  id={`task-name-${taskIndex}`}
                  value={task.name}
                  onChange={(e) =>
                    handleTaskChange(taskIndex, "name", e.target.value)
                  }
                  placeholder="e.g., search_apis"
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label
                  htmlFor={`task-endpoint-${taskIndex}`}
                  className="text-sm"
                >
                  API Endpoint
                </Label>
                <Input
                  id={`task-endpoint-${taskIndex}`}
                  value={task.endpoint}
                  onChange={(e) =>
                    handleTaskChange(taskIndex, "endpoint", e.target.value)
                  }
                  placeholder="https://api.example.com/data"
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor={`task-description-${taskIndex}`}
                className="text-sm"
              >
                Description
              </Label>
              <Input
                id={`task-description-${taskIndex}`}
                value={task.description}
                onChange={(e) =>
                  handleTaskChange(taskIndex, "description", e.target.value)
                }
                placeholder="What this tool does..."
                className="bg-background border-border"
              />
            </div>

            <Separator className="my-4" />

            {/* Parameters */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Parameters
              </Label>
              <div className="space-y-3">
                {Object.entries(task.params_schema.properties).map(
                  ([paramName, paramSchema]) => (
                    <div
                      key={paramName}
                      className="p-3 bg-background rounded-md border border-border grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-3">
                        <Input
                          value={paramName}
                          onChange={(e) =>
                            handleParamChange(
                              taskIndex,
                              paramName,
                              e.target.value,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="param_name"
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-3">
                        <Select
                          value={paramSchema.type}
                          onValueChange={(value) =>
                            handleParamChange(
                              taskIndex,
                              paramName,
                              paramName,
                              "type",
                              value
                            )
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Input
                          value={paramSchema.description}
                          onChange={(e) =>
                            handleParamChange(
                              taskIndex,
                              paramName,
                              paramName,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Description"
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center gap-2">
                        <Checkbox
                          id={`required-${taskIndex}-${paramName}`}
                          checked={task.params_schema.required.includes(
                            paramName
                          )}
                          onCheckedChange={(checked) =>
                            handleRequiredChange(taskIndex, paramName, checked)
                          }
                        />
                        <Label
                          htmlFor={`required-${taskIndex}-${paramName}`}
                          className="text-xs"
                        >
                          Req
                        </Label>
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeParameter(taskIndex, paramName)
                          }
                          className="h-8 w-8 text-destructive/70 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                )}
                <Button
                  onClick={() => addParameter(taskIndex)}
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Parameter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        onClick={addTask}
        variant="outline"
        className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Tool
      </Button>
    </div>
  );
};

export default TaskManager;