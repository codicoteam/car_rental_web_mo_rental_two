// pages/auth/SignupScreen.tsx
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Mail, Phone, User, Lock, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { authService } from "../../Services/adminAndManager/register_service";

/** Small, tasteful spinner */
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="relative">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <div
        className="absolute top-0 left-0 w-8 h-8 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"
        style={{ animationDuration: "0.75s" }}
      />
    </div>
  </div>
);

/** Basic validators */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongEnough = (pwd: string) =>
  pwd.length >= 8 &&
  /[A-Z]/.test(pwd) &&
  /[a-z]/.test(pwd) &&
  /\d/.test(pwd);

export default function SignupScreen() {
  const location = useLocation();
  const navigate = useNavigate();

  /** Read role from query OR session (carried over from role picker / sign in) */
  const initialSelectedRole = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("role") || sessionStorage.getItem("selected_role") || "";
  }, [location.search]);

  const [selectedRole, setSelectedRole] = useState<string>(initialSelectedRole);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  /** Inline field errors for better UX */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (initialSelectedRole) {
      setSelectedRole(initialSelectedRole);
      sessionStorage.setItem("selected_role", initialSelectedRole);
    }
  }, [initialSelectedRole]);

  /** Real-time validation helpers */
  const setField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
    setSuccessMessage(null);

    // per-field validation
    const e: Record<string, string> = { ...errors };
    if (name === "email") {
      if (!value.trim()) e.email = "Email is required";
      else if (!emailRegex.test(value.trim())) e.email = "Please enter a valid email address";
      else delete e.email;
    }
    if (name === "password") {
      if (!strongEnough(value))
        e.password =
          "Min 8 chars with upper, lower & a number";
      else delete e.password;
      // also re-check confirmation
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        e.confirmPassword = "Passwords do not match";
      } else if (formData.confirmPassword) {
        delete e.confirmPassword;
      }
    }
    if (name === "confirmPassword") {
      if (value !== (name === "confirmPassword" ? formData.password : formData.confirmPassword))
        e.confirmPassword = "Passwords do not match";
      else delete e.confirmPassword;
    }
    if (name === "fullName") {
      if (!value.trim()) e.fullName = "Full name is required";
      else delete e.fullName;
    }
    setErrors(e);
  };

  /** Password meter (simple, unobtrusive) */
  const passwordStrength = (() => {
    const v = formData.password;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[\W_]/.test(v)) score++;
    return score; // 0..5
  })();

  /** One-time OTP modal and navigation */
  const showVerificationModal = async (email: string) => {
    setIsVerifying(true);
    const { value: otp } = await Swal.fire({
      title: "Verify Your Email",
      html: `
        <div class="text-center">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <p class="text-gray-600 mb-2">We sent a 6-digit verification code to</p>
          <p class="text-blue-600 font-semibold mb-4">${email}</p>
          <input 
            type="text" 
            id="otp-input" 
            class="swal2-input" 
            placeholder="Enter 6-digit code" 
            maxlength="6"
            style="font-size: 1.5rem; text-align: center; letter-spacing: 0.5em;"
          >
          <p class="text-sm text-gray-500 mt-3">Check your email, including the spam folder</p>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Verify Email",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      showLoaderOnConfirm: true,
      preConfirm: () => {
        const otpInput = document.getElementById("otp-input") as HTMLInputElement;
        const otpValue = otpInput?.value.trim();
        if (!otpValue || otpValue.length !== 6) {
          Swal.showValidationMessage("Please enter a valid 6-digit code");
          return false;
        }
        return otpValue;
      },
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "px-6 py-2 rounded-xl font-semibold",
        cancelButton: "px-6 py-2 rounded-xl font-semibold",
      },
      didOpen: () => {
        const otpInput = document.getElementById("otp-input") as HTMLInputElement;
        if (otpInput) {
          otpInput.focus();
          otpInput.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            target.value = target.value.replace(/\D/g, "").slice(0, 6);
          });
          otpInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
              const confirmButton = document.querySelector(".swal2-confirm") as HTMLButtonElement;
              confirmButton?.click();
            }
          });
        }
      },
    });

    if (otp) {
      try {
        Swal.fire({
          title: "Verifying...",
          text: "Please wait while we verify your code",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const result = await authService.verifyEmail({ email, otp });
        Swal.close();

        await Swal.fire({
          title: "Success!",
          html: `
            <div class="text-center">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p class="text-gray-700 mb-2">Welcome, <strong>${result.user.full_name}</strong>!</p>
              <p class="text-gray-600">Your email has been verified successfully.</p>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#10b981",
          confirmButtonText: "Continue",
          customClass: { popup: "rounded-2xl" },
        });

        /** Navigate to correct dashboard (priority: selectedRole → user.roles[0]) */
        const role = (selectedRole || result.user.roles?.[0] || "customer").toLowerCase();

        switch (role) {
          case "admin":
            navigate("/admin-dashboard");
            break;
          case "manager":
          case "branch-manager": // keep supporting this alias if used elsewhere
            navigate("/branch-manager-dashboard");
            break;
          case "agent":
            navigate("/agentdashboard");
            break;
          case "driver":
            navigate("/driver-dashboard");
            break;
          case "customer":
          default:
            navigate("/dashboardy");
            break;
        }
      } catch (error: any) {
        Swal.close();
        let errorMessage = error?.message || "Invalid verification code. Please try again.";
        if (/(invalid|expired)/i.test(errorMessage)) {
          errorMessage = "The verification code is invalid or has expired. Please request a new code.";
        } else if (/(not found|user)/i.test(errorMessage)) {
          errorMessage = "No pending verification found for this email. Please try registering again.";
        }
        const retry = await Swal.fire({
          title: "Verification Failed",
          text: errorMessage,
          icon: "error",
          confirmButtonColor: "#ef4444",
          confirmButtonText: "Try Again",
          showCancelButton: true,
          cancelButtonText: "Cancel",
          customClass: { popup: "rounded-2xl" },
        });
        if (retry.isConfirmed) showVerificationModal(email);
      }
    }
    setIsVerifying(false);
  };

  /** Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // final validation sweep
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email.trim())) newErrors.email = "Please enter a valid email address";
    if (!formData.password) newErrors.password = "Password is required";
    else if (!strongEnough(formData.password))
      newErrors.password = "Min 8 chars with upper, lower & a number";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setFormError("Please fix the errors below and try again.");
      return;
    }

    try {
      setBusy(true);
      const payload = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        roles: selectedRole ? [selectedRole] : ["customer"], // pass roles to backend
      };

      const res = await authService.register(payload);

      setSuccessMessage("Account created! Check your email for the verification code.");
      setFormData({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });

      // trigger OTP flow
      setTimeout(() => showVerificationModal(res.email), 600);
    } catch (err: any) {
      let errorMessage = err?.message || "Failed to create account. Please try again.";
      if (/(already exists|duplicate)/i.test(errorMessage)) {
        errorMessage = "An account with this email already exists. Please try logging in instead.";
      } else if (/(network|timeout)/i.test(errorMessage)) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      setFormError(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || isVerifying;

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Lights */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl top-20 left-10 animate-pulse" />
        <div className="absolute w-96 h-96 bg-white/5 rounded-full blur-3xl bottom-20 right-10 animate-pulse" />
        <div className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl top-1/2 left-1/3 animate-pulse delay-1000" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-300 hover:scale-[1.02]">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Create Account</h1>

            {selectedRole && (
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-2 bg-blue-500/30 rounded-full border border-blue-400/50">
                <ShieldCheck className="w-4 h-4 text-blue-200" />
                <p className="text-blue-200 text-sm font-medium">
                  Registering as:{" "}
                  <span className="capitalize font-bold">{selectedRole.replace("-", " ")}</span>
                </p>
              </div>
            )}

            <p className="text-gray-300 text-sm">Join our exclusive automotive community</p>
            {!selectedRole && (
              <p className="text-yellow-300 text-xs mt-2">No role selected — you’ll be a customer by default.</p>
            )}
          </div>

          {/* Success + Form-level Error */}
          {successMessage && (
            <div className="mb-4 rounded-xl border border-emerald-400/60 bg-emerald-900/40 px-4 py-3 text-sm text-emerald-100 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {formError && (
            <div className="mb-4 rounded-xl border border-red-400/60 bg-red-900/40 px-4 py-3 text-sm text-red-100 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>{formError}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full Name */}
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                placeholder="Full Name"
                required
                disabled={disabled}
                className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${errors.fullName ? "border-red-400/70 focus:border-red-400" : "border-white/20 focus:border-blue-400/50"
                  }`}
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
              />
              {errors.fullName && (
                <p id="fullName-error" className="mt-1 text-xs text-red-300">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="Email Address"
                required
                disabled={disabled}
                className={`w-full pl-12 pr-4 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${errors.email ? "border-red-400/70 focus:border-red-400" : "border-white/20 focus:border-blue-400/50"
                  }`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email ? (
                <p id="email-error" className="mt-1 text-xs text-red-300">
                  {errors.email}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-300/70">Use a valid, accessible email for OTP verification</p>
              )}
            </div>

            {/* Phone */}
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="Phone Number (Optional)"
                disabled={disabled}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder="Password"
                required
                disabled={disabled}
                minLength={8}
                className={`w-full pl-12 pr-12 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${errors.password ? "border-red-400/70 focus:border-red-400" : "border-white/20 focus:border-blue-400/50"
                  }`}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : "password-hint"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={disabled}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {errors.password ? (
                <p id="password-error" className="mt-1 text-xs text-red-300">
                  {errors.password}
                </p>
              ) : (
                <div id="password-hint" className="mt-1 text-xs text-gray-300/70">
                  Min 8 chars with upper, lower & a number
                </div>
              )}

              {/* Strength bar */}
              <div className="mt-2 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-2 transition-all ${passwordStrength <= 2 ? "bg-red-400" : passwordStrength <= 3 ? "bg-yellow-400" : "bg-green-500"
                    }`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                placeholder="Confirm Password"
                required
                disabled={disabled}
                className={`w-full pl-12 pr-12 py-4 bg-white/10 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${errors.confirmPassword ? "border-red-400/70 focus:border-red-400" : "border-white/20 focus:border-blue-400/50"
                  }`}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                disabled={disabled}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {errors.confirmPassword && (
                <p id="confirm-error" className="mt-1 text-xs text-red-300">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={disabled}
              className={`w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 border border-blue-500/30 hover:border-blue-400/50 hover:from-blue-700 hover:to-blue-900 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${busy ? "relative overflow-hidden" : ""
                }`}
            >
              {busy ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-2">Creating account...</span>
                </div>
              ) : isVerifying ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-2">Verifying...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-300 text-sm">
              Already have an account?{" "}
              <Link
                to={`/login${selectedRole ? `?role=${encodeURIComponent(selectedRole)}` : ""}`}
                className="text-blue-400 font-semibold transition-colors hover:text-blue-300 underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6 backdrop-blur-sm bg-black/30 rounded-lg py-2 px-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
