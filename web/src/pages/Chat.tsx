import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Send,
  Bot,
  User,
  X,
  FileText,
  Trees,
  Loader2,
  Trash2,
  Copy,
  Check,
  Upload,
  Settings,
  ChevronDown,
  Key,
  Cpu
} from 'lucide-react'
import { chatApi, uploadsApi } from '../lib/api'

// Types
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: Attachment[]
  isStreaming?: boolean
}

interface Attachment {
  id: string
  type: 'investment' | 'file'
  name: string
  data: any
}

interface InvestmentOption {
  id: string
  name: string
  category: string
  city?: string
}

interface FileOption {
  id: string
  filename: string
  mime_type?: string
  size_bytes?: number
}

export default function Chat() {
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInvestment, setSelectedInvestment] = useState<InvestmentOption | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileOption[]>([])

  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // File input ref for direct upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())

  // Model settings
  const [showModelSettings, setShowModelSettings] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('chat_api_key') || '')
  const [modelName, setModelName] = useState(() => localStorage.getItem('chat_model_name') || 'gpt-4o')

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('chat_api_key', apiKey)
  }, [apiKey])

  useEffect(() => {
    localStorage.setItem('chat_model_name', modelName)
  }, [modelName])

  // Fetch data for context selection
  const { data: investments } = useQuery({
    queryKey: ['chat-investments'],
    queryFn: chatApi.getInvestmentsForContext,
  })

  // Handle direct file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      setUploadingFiles(prev => new Set(prev).add(fileId))

      try {
        // 1. Request upload URL
        const uploadRequest = await uploadsApi.requestUrl({
          filename: file.name,
          content_type: file.type || 'application/octet-stream',
        })

        // 2. Upload directly to storage
        const uploadResponse = await fetch(uploadRequest.upload_url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
        })

        if (!uploadResponse.ok) {
          throw new Error('Upload failed')
        }

        // 3. Confirm upload
        await uploadsApi.confirm({
          file_id: uploadRequest.file_id,
          request_analysis: true,
        })

        // 4. Add to selected files
        setSelectedFiles(prev => [...prev, {
          id: uploadRequest.file_id,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        }])
      } catch (error) {
        console.error('Upload error:', error)
      } finally {
        setUploadingFiles(prev => {
          const next = new Set(prev)
          next.delete(fileId)
          return next
        })
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [inputValue])

  // Send message
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      attachments: [
        ...(selectedInvestment ? [{
          id: selectedInvestment.id,
          type: 'investment' as const,
          name: selectedInvestment.name,
          data: selectedInvestment
        }] : []),
        ...selectedFiles.map(f => ({
          id: f.id,
          type: 'file' as const,
          name: f.filename,
          data: f
        }))
      ]
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Add assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }])

    try {
      // Build message history for API
      const apiMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content
        }))

      apiMessages.push({
        role: 'user',
        content: userMessage.content
      })

      // Use streaming API
      const stream = await chatApi.sendMessageStream({
        messages: apiMessages,
        investment_id: selectedInvestment?.id,
        file_ids: selectedFiles.map(f => f.id),
        model: modelName,
        api_key: apiKey || undefined,
      })

      const reader = stream
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Parse SSE data
        const lines = value.split('\n\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'content') {
                fullContent += data.content
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: fullContent }
                    : m
                ))
              } else if (data.type === 'done') {
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, isStreaming: false }
                    : m
                ))
              } else if (data.type === 'error') {
                console.error('Stream error:', data.error)
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, isStreaming: false }
          : m
      ))

    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { 
              ...m, 
              content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
              isStreaming: false 
            }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Clear chat
  const clearChat = () => {
    setMessages([])
    setSelectedInvestment(null)
    setSelectedFiles([])
  }

  // Copy message
  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Suggested prompts
  const suggestedPrompts = [
    "Resume mis inversiones de tierra",
    "¿Cuál es el valor total de mi portafolio?",
    "Analiza el último documento que subí",
    "¿Qué inversiones están activas?",
    "Compara el rendimiento de mis propiedades",
  ]

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col fade-in">
      {/* Header */}
      <div className="flex items-center justify-end mb-4">
        {/* Clear Chat */}
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-xl transition-colors"
            title="Limpiar chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-4"
      >
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-cream/10 rounded-3xl border border-cream/20 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Bot className="h-10 w-10 text-cream" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              ¿En qué puedo ayudarte?
            </h2>
            <p className="text-text-secondary max-w-md mb-8">
              Soy Prism Chat, tu asistente para gestionar el portafolio de inversiones familiar. 
              Puedo responder preguntas sobre tus inversiones, analizar documentos y más.
            </p>
            
            {/* Suggested Prompts */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputValue(prompt)}
                  className="px-4 py-2 text-sm text-text-secondary bg-surface border border-border rounded-full hover:border-cream/30 hover:text-cream transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-cream text-void'
                  : 'bg-surface border border-border'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4 text-cream" />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && message.role === 'user' && (
                  <div className="flex flex-wrap gap-2 justify-end mb-2">
                    {message.attachments.map(att => (
                      <span
                        key={att.id}
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-cream/10 text-cream rounded-lg border border-cream/20"
                      >
                        {att.type === 'investment' ? <Trees className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {att.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`inline-block text-left px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-cream text-void'
                      : 'bg-surface border border-border text-text-primary'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content || (message.isStreaming ? (
                      <span className="flex items-center gap-2 text-text-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Pensando...
                      </span>
                    ) : '')}
                  </div>
                  
                  {/* Streaming indicator */}
                  {message.isStreaming && message.content && (
                    <span className="inline-block w-2 h-4 ml-1 bg-cream animate-pulse" />
                  )}
                </div>

                {/* Actions */}
                {message.role === 'assistant' && !message.isStreaming && message.content && (
                  <div className="flex items-center gap-2 mt-1 ml-1">
                    <button
                      onClick={() => copyMessage(message.content, message.id)}
                      className="p-1.5 text-text-muted hover:text-cream hover:bg-surface rounded-lg transition-colors"
                      title="Copiar"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className="text-[10px] text-text-muted">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative">
        {/* Context badges above input */}
        {(selectedInvestment || selectedFiles.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {selectedInvestment && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-cream/10 text-cream rounded-lg border border-cream/20">
                <Trees className="h-3 w-3" />
                {selectedInvestment.name}
                <button 
                  onClick={() => setSelectedInvestment(null)}
                  className="ml-1 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedFiles.map(file => (
              <span key={file.id} className="inline-flex items-center gap-1.5 px-2 py-1 text-xs bg-surface text-text-secondary rounded-lg border border-border">
                <FileText className="h-3 w-3" />
                {file.filename}
                <button 
                  onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))}
                  className="ml-1 hover:text-error"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative flex items-end gap-2 bg-surface border border-border rounded-2xl p-3 focus-within:border-cream/30 focus-within:ring-1 focus-within:ring-cream/20 transition-all">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Textarea container with buttons inside */}
          <div className="flex-1 relative flex items-start">
            {/* Left buttons: Upload and Model Settings */}
            <div className="absolute left-0 bottom-1 flex items-center gap-1 z-10">
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || uploadingFiles.size > 0}
                className="p-2 rounded-lg text-text-muted hover:text-cream hover:bg-surface-elevated transition-colors disabled:opacity-50"
                title="Adjuntar archivo"
              >
                {uploadingFiles.size > 0 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </button>

              {/* Model Settings button */}
              <button
                onClick={() => setShowModelSettings(!showModelSettings)}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                  showModelSettings || apiKey 
                    ? 'text-cream bg-cream/10' 
                    : 'text-text-muted hover:text-cream hover:bg-surface-elevated'
                }`}
                title="Configurar modelo"
              >
                <Cpu className="h-4 w-4" />
              </button>

              {/* Model Settings Dropdown */}
              {showModelSettings && (
                <div className="absolute left-0 bottom-full mb-2 w-72 bg-surface-elevated border border-border rounded-xl shadow-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">Modelo</span>
                    <button 
                      onClick={() => setShowModelSettings(false)}
                      className="text-text-muted hover:text-text-primary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Model Name Input */}
                  <div className="space-y-2">
                    <label className="text-xs text-text-muted uppercase tracking-wider">Nombre del Modelo</label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="gpt-4o, claude-3-5-sonnet, etc."
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-cream/30"
                    />
                    <p className="text-[10px] text-text-muted">
                      Ej: gpt-4o, claude-3-5-sonnet, gemini-1.5-flash
                    </p>
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-2">
                    <label className="text-xs text-text-muted uppercase tracking-wider">API Key</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-cream/30"
                      />
                    </div>
                    <p className="text-[10px] text-text-muted">
                      Se guarda localmente en tu navegador
                    </p>
                  </div>

                  {/* Current Model Display */}
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-success' : 'bg-warning'}`} />
                      {apiKey ? `Usando: ${modelName}` : 'Usando modelo por defecto del servidor'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              rows={1}
              className="w-full bg-transparent text-text-primary placeholder:text-text-muted resize-none outline-none text-sm min-h-[24px] max-h-[200px] py-2 pl-20 pr-2"
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`flex-shrink-0 p-2.5 rounded-xl transition-all ${
              inputValue.trim() && !isLoading
                ? 'bg-cream text-void hover:bg-cream-light'
                : 'bg-surface-elevated text-text-muted cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
