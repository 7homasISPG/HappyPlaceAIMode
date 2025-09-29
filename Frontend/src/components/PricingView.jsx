import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const PricingView = ({ payload }) => {
  if (!payload || payload.length === 0) {
    return <p className="p-4 text-gray-500">No pricing data available</p>;
  }

  return (
    <div className="grid gap-6 p-4"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
      }}
    >
      {payload.map((course, idx) => {
        // Price keys contain "Hours" but are not "Hours/Week"
        const priceKeys = Object.keys(course).filter(
          (key) => key.toLowerCase().includes("hours") && key !== "Hours/Week"
        );
        const detailKeys = Object.keys(course).filter(
          (key) =>
            !priceKeys.includes(key) &&
            key.toLowerCase() !== "course" &&
            key.toLowerCase() !== "price/hour"
        );

        return (
          <Card key={idx} className="shadow-md border rounded-xl flex flex-col">
            <CardContent className="p-6 flex flex-col flex-1 items-center">
              {/* Course Title */}
              <h2 className="text-lg font-bold text-center mb-4">
                {course.Course}
              </h2>

              {/* Price Options */}
              <div className="flex flex-col gap-3 w-full">
                {priceKeys.map((key) => (
                  <div
                    key={key}
                    className="border border-red-500 text-red-600 rounded-lg px-4 py-2 flex justify-between font-semibold"
                  >
                    <span>{key}</span>
                    <span>{course[key]}</span>
                  </div>
                ))}
              </div>

              {/* Price per hour (optional) */}
              {course["Price/Hour"] && (
                <p className="text-sm text-gray-500 mt-3">
                  {course["Price/Hour"]}
                </p>
              )}

              {/* Details */}
              <ul className="mt-5 w-full space-y-3">
                {detailKeys.map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <CheckCircle className="text-gray-500 w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">
                      <span className="font-medium">{key}:</span>{" "}
                      {course[key]}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PricingView;
