import { MainLayout } from '@/components/layout/MainLayout';
import { usePerformanceReviews } from '@/hooks/usePerformance';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, Star, Calendar, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function PerformanceReviews() {
    const { data: reviews = [], isLoading } = usePerformanceReviews();

    const getRatingStars = (rating: number | null) => {
        if (!rating) return '-';
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-hrms-warning text-hrms-warning' : 'text-muted-foreground/30'}`} />
                ))}
            </div>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return <Badge className="bg-hrms-success/10 text-hrms-success border-hrms-success/20">Completed</Badge>;
            case 'in_progress':
                return <Badge className="bg-hrms-primary/10 text-hrms-primary border-hrms-primary/20">In Progress</Badge>;
            case 'scheduled':
                return <Badge variant="outline" className="text-hrms-warning border-hrms-warning/20">Scheduled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <MainLayout onAddNew={() => { }}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Performance Reviews</h1>
                        <p className="text-muted-foreground">Schedule and manage employee performance reviews.</p>
                    </div>
                    <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Review
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="border rounded-lg overflow-hidden bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Intern</TableHead>
                                    <TableHead>Review Date</TableHead>
                                    <TableHead>Reviewer</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviews.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            No performance reviews found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reviews.map((review) => (
                                        <TableRow key={review.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback>
                                                            {review.employee?.first_name?.[0]}
                                                            {review.employee?.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{review.employee?.first_name} {review.employee?.last_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{format(new Date(review.review_date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {review.reviewer ? `${review.reviewer.first_name} ${review.reviewer.last_name}` : 'Not assigned'}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getRatingStars(review.rating)}</TableCell>
                                            <TableCell>{getStatusBadge(review.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
