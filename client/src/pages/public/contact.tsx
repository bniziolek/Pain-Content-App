import { useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, MessageSquare, HelpCircle, FileText, Users } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    inquiryType: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "For general inquiries",
      contact: "hello@driverpath.com",
      action: "mailto:hello@driverpath.com"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Mon-Fri, 9am-5pm EST",
      contact: "(555) 123-4567",
      action: "tel:+15551234567"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Health Drivers Institute",
      contact: "123 Healthcare Blvd, Suite 400",
      action: null
    }
  ];

  const supportOptions = [
    {
      icon: HelpCircle,
      title: "Help Center",
      description: "Browse our knowledge base for quick answers to common questions",
      link: "/faq"
    },
    {
      icon: FileText,
      title: "Documentation",
      description: "Technical guides and API documentation for developers",
      link: "/faq"
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with other clinicians using DriverPath",
      link: "/faq"
    }
  ];

  return (
    <PublicLayout>
      <div className="py-16 bg-gray-50" data-testid="contact-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4" data-testid="contact-heading">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="contact-description">
            Have questions about DriverPath? We'd love to hear from you. Our team is here to help.
          </p>
        </div>
      </div>

      <div className="py-16" data-testid="contact-content">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" data-testid="heading-form">Send Us a Message</h2>
              
              {submitted ? (
                <Card data-testid="form-success">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-4">
                      Thank you for reaching out. Our team will respond within 1-2 business days.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)} data-testid="button-send-another">
                      Send Another Message
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Dr. Jane Smith"
                        required
                        data-testid="input-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jane@clinic.com"
                        required
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Physical Therapy Associates"
                      data-testid="input-organization"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inquiryType">Inquiry Type *</Label>
                    <Select
                      value={formData.inquiryType}
                      onValueChange={(value) => setFormData({ ...formData, inquiryType: value })}
                    >
                      <SelectTrigger data-testid="select-inquiry-type">
                        <SelectValue placeholder="Select an inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo" data-testid="option-demo">Request a Demo</SelectItem>
                        <SelectItem value="pricing" data-testid="option-pricing">Pricing Question</SelectItem>
                        <SelectItem value="support" data-testid="option-support">Technical Support</SelectItem>
                        <SelectItem value="partnership" data-testid="option-partnership">Partnership Inquiry</SelectItem>
                        <SelectItem value="feedback" data-testid="option-feedback">Product Feedback</SelectItem>
                        <SelectItem value="other" data-testid="option-other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us how we can help..."
                      rows={5}
                      required
                      data-testid="input-message"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" data-testid="button-submit">
                    Send Message
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    By submitting this form, you agree to our{" "}
                    <Link href="/privacy">
                      <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
                    </Link>
                  </p>
                </form>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" data-testid="heading-contact-info">Contact Information</h2>
              
              <div className="space-y-4 mb-12">
                {contactMethods.map((method, i) => (
                  <Card key={i} data-testid={`card-contact-method-${i}`}>
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <method.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900" data-testid={`title-contact-method-${i}`}>{method.title}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{method.description}</p>
                        {method.action ? (
                          <a href={method.action} className="text-primary hover:underline" data-testid={`link-contact-method-${i}`}>
                            {method.contact}
                          </a>
                        ) : (
                          <p className="text-gray-900">{method.contact}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-gray-50 p-6 rounded-xl mb-12" data-testid="business-hours">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900">Business Hours</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="text-gray-900">9:00 AM - 5:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday - Sunday</span>
                    <span className="text-gray-900">Closed</span>
                  </div>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4" data-testid="heading-self-service">Self-Service Options</h3>
              <div className="space-y-3">
                {supportOptions.map((option, i) => (
                  <Link key={i} href={option.link}>
                    <Card className="hover:bg-gray-50 transition-colors cursor-pointer" data-testid={`card-support-option-${i}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <option.icon className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{option.title}</h4>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
