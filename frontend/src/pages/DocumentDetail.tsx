import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { Loader2, ArrowLeft, Download, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Document {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}

interface DocumentResponse {
  document: Document;
}

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, error } = useQuery<DocumentResponse>({
    queryKey: ["document", id],
    queryFn: async () => {
      const response = await api.get<DocumentResponse>(`/documents/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Handle error with useEffect
  React.useEffect(() => {
    if (error) {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error.message as string)
        : "Failed to load document. Please try again later.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Navigate back to documents page if document not found
      navigate("/documents");
    }
  }, [error, toast, navigate]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      navigate("/documents");
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error.message as string)
        : "Failed to delete document. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    if (isDeleting) {
      deleteMutation.mutate();
    } else {
      setIsDeleting(true);
    }
  };

  const handleDownload = async () => {
    if (!data?.document.imageUrl) return;
    
    try {
      const response = await api.get(`/documents/download/${id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${data.document.title}.jpg`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Success",
        description: "Document downloaded successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-4 text-gray-500">Loading document...</p>
      </div>
    );
  }

  const document = data?.document;

  if (!document) {
    return null;
  }

  const formattedDate = new Date(document.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 flex items-center" 
        onClick={() => navigate("/documents")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Documents
      </Button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{document.title}</h1>
              <p className="text-sm text-gray-500 mt-1">Added on {formattedDate}</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center" 
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button 
                variant={isDeleting ? "destructive" : "outline"} 
                size="sm" 
                className="flex items-center" 
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Confirm Delete" : "Delete"}
              </Button>
            </div>
          </div>
          
          {document.description && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{document.description}</p>
            </div>
          )}
          
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Document Image</h2>
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={document.imageUrl} 
                alt={document.title} 
                className="w-full object-contain max-h-[500px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
