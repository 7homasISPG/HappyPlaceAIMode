// src/pages/PublicFormPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchPublicWorkflowDefinition, triggerFormSubmission } from '@/api'; // We will create these API functions

const PublicFormPage = () => {
    const { flowId } = useParams();
    const [formDef, setFormDef] = useState(null);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadForm = async () => {
            try {
                if (!flowId) throw new Error("No Flow ID provided.");
                const definition = await fetchPublicWorkflowDefinition(flowId);
                
                // Assuming the form definition is on the trigger node
                const triggerNode = definition.nodes?.find(node => node.data.nodeType === 'formTrigger');
                if (!triggerNode) throw new Error("This workflow does not have a valid form trigger.");

                setFormDef(triggerNode.data);
            } catch (err) {
                setError(err.message || "Failed to load the form. Please check the URL.");
            } finally {
                setIsLoading(false);
            }
        };
        loadForm();
    }, [flowId]);

    const handleInputChange = (fieldName, value) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        // Placeholder API key. In a real app, this would be part of the formDef or another mechanism.
        const apiKey = 'TEST_API_KEY_12345';

        try {
            const payload = {
                flow_id: flowId,
                form_data: formData,
            };
            const result = await triggerFormSubmission(payload, apiKey);
            setSuccess(result.message || "Form submitted successfully!");
            setFormData({}); // Clear form on success
        } catch (err) {
            setError(err.response?.data?.detail || "An error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }

    if (error && !formDef) {
        return <div className="flex h-screen w-screen items-center justify-center p-8 text-center text-red-600">{error}</div>;
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">{formDef?.formTitle || 'Form'}</CardTitle>
                    <CardDescription>{formDef?.formDescription || 'Please fill out the details below.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-green-600">
                            <CheckCircle className="h-16 w-16 mb-4" />
                            <h3 className="text-xl font-semibold">Thank You!</h3>
                            <p>{success}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {formDef?.formElements?.map((element) => (
                                <div key={element.name} className="space-y-2">
                                    <Label htmlFor={element.name}>{element.label} {element.required && <span className="text-red-500">*</span>}</Label>
                                    {element.type === 'textarea' ? (
                                        <Textarea id={element.name} required={element.required} value={formData[element.name] || ''} onChange={(e) => handleInputChange(element.name, e.target.value)} />
                                    ) : element.type === 'checkbox' ? (
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Checkbox id={element.name} required={element.required} checked={!!formData[element.name]} onCheckedChange={(checked) => handleInputChange(element.name, checked)} />
                                            <label htmlFor={element.name} className="text-sm font-medium leading-none">I agree</label>
                                        </div>
                                    ) : (
                                        <Input type={element.type} id={element.name} required={element.required} value={formData[element.name] || ''} onChange={(e) => handleInputChange(element.name, e.target.value)} />
                                    )}
                                </div>
                            ))}
                            {error && <p className="text-sm text-red-500 flex items-center"><AlertCircle className="h-4 w-4 mr-2" />{error}</p>}
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Submit
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PublicFormPage;