import { MainLayout } from '@/components/layout/MainLayout';
import { useCourses } from '@/hooks/useTraining';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Clock, Plus, Users } from 'lucide-react';

export default function Courses() {
    const { data: courses = [], isLoading } = useCourses();

    return (
        <MainLayout onAddNew={() => { }}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Training Courses</h1>
                        <p className="text-muted-foreground">Browse and manage employee training programs.</p>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Course
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : courses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg text-center p-8">
                        <p className="text-muted-foreground mb-4">No courses available.</p>
                        <Button variant="outline">Create your first training course</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <Card key={course.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-hrms-primary/10 flex items-center justify-center mb-4 text-hrms-primary">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl">{course.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-4 w-4" />
                                            <span>{course.duration || 'Self-paced'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4" />
                                            <span>0 Enrolled</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t pt-4">
                                    <Button className="w-full" variant="outline">
                                        View Course Details
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
