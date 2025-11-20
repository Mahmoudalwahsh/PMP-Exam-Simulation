import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ExamTestRecord } from "@shared/schema";

interface ExamHistoryProps {
  records: ExamTestRecord[];
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function ExamHistory({
  records,
  total,
  currentPage,
  pageSize,
  onPageChange,
  isLoading = false,
}: ExamHistoryProps) {
  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 70) return "default";
    if (percentage >= 50) return "secondary";
    return "destructive";
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-secondary-foreground">
          Loading exam history...
        </div>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-secondary-foreground">
          No exam records found
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead data-testid="header-tester-name">Tester Name</TableHead>
                <TableHead data-testid="header-exam-title">Exam</TableHead>
                <TableHead data-testid="header-score" className="text-right">
                  Score
                </TableHead>
                <TableHead data-testid="header-percentage" className="text-right">
                  Percentage
                </TableHead>
                <TableHead data-testid="header-date">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} data-testid={`row-result-${record.id}`}>
                  <TableCell className="font-medium" data-testid={`text-tester-${record.id}`}>
                    {record.testerName}
                  </TableCell>
                  <TableCell data-testid={`text-exam-${record.id}`}>
                    {record.examTitle}
                  </TableCell>
                  <TableCell className="text-right" data-testid={`text-score-${record.id}`}>
                    {record.score}/{record.totalQuestions}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getScoreBadgeVariant(record.percentage)} data-testid={`badge-percentage-${record.id}`}>
                      {record.percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`text-date-${record.id}`}>
                    {formatDate(record.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-secondary-foreground">
              Page {currentPage} of {totalPages} ({total} total records)
            </div>
            <div className="flex gap-2">
              <Button
                data-testid="button-prev-page"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                data-testid="button-next-page"
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
