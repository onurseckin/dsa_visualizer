import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_autodiff_engines_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Matrix Calculus Adjoint Identities",
  subtitle: "Matrix Derivatives, Trace Invariants, and Log-Determinant Gradients",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Matrix Calculus Adjoint Derivation: Linear Layer Gradient",
      theorem:
        "For a matrix multiplication layer $Y = X W$ where $X \\in \\mathbb{R}^{B \\times D_{\\text{in}}}$, $W \\in \\mathbb{R}^{D_{\\text{in}} \\times D_{\\text{out}}}$, and scalar loss $\\mathcal{L}(Y)$ with output adjoint $\\bar{Y} = \\frac{\\partial \\mathcal{L}}{\\partial Y} \\in \\mathbb{R}^{B \\times D_{\\text{out}}}$, the exact input and weight adjoints are given by:\n$$\\bar{X} = \\frac{\\partial \\mathcal{L}}{\\partial X} = \\bar{Y} W^T \\in \\mathbb{R}^{B \\times D_{\\text{in}}}, \\quad \\bar{W} = \\frac{\\partial \\mathcal{L}}{\\partial W} = X^T \\bar{Y} \\in \\mathbb{R}^{D_{\\text{in}} \\times D_{\\text{out}}}$$",
      proof:
        "1. Express the scalar loss differential $d\\mathcal{L}$ in terms of the matrix Frobenius inner product:\n   $$d\\mathcal{L} = \\text{Tr}\\left( \\bar{Y}^T dY \\right)$$\n2. Differentiating $Y = X W$ yields the differential $dY = (dX) W + X (dW)$.\n3. Substitute $dY$ into the loss differential:\n   $$d\\mathcal{L} = \\text{Tr}\\left( \\bar{Y}^T ((dX) W + X (dW)) \\right) = \\text{Tr}\\left( \\bar{Y}^T (dX) W \\right) + \\text{Tr}\\left( \\bar{Y}^T X (dW) \\right)$$\n4. Using the cyclic property of the matrix trace $\\text{Tr}(A B) = \\text{Tr}(B A)$ and $\\text{Tr}(A^T) = \\text{Tr}(A)$:\n   - For the first term: $\\text{Tr}\\left( \\bar{Y}^T (dX) W \\right) = \\text{Tr}\\left( W \\bar{Y}^T (dX) \\right) = \\text{Tr}\\left( (\\bar{Y} W^T)^T dX \\right)$.\n   - For the second term: $\\text{Tr}\\left( \\bar{Y}^T X (dW) \\right) = \\text{Tr}\\left( (X^T \\bar{Y})^T dW \\right)$.\n5. Equating these to the fundamental matrix gradient definition $d\\mathcal{L} = \\text{Tr}\\left( \\bar{X}^T dX \\right) + \\text{Tr}\\left( \\bar{W}^T dW \\right)$ identifies:\n   $$\\bar{X} = \\bar{Y} W^T, \\quad \\bar{W} = X^T \\bar{Y}$$\n6. This rigorous trace identity derivation establishes the exact transposed matrix multiplications implemented in PyTorch's `torch.nn.functional.linear` backward pass.",
    },
    {
      type: "math_proof",
      title: "Log-Determinant Adjoint Gradient Theorem",
      theorem:
        "For an invertible matrix $A \\in \\mathbb{R}^{n \\times n}$, the gradient of the log-determinant function $f(A) = \\ln \\det(A)$ with respect to matrix $A$ is:\n$$\\nabla_A \\ln \\det(A) = A^{-T} = (A^{-1})^T$$",
      proof:
        "1. By Jacobi's formula for the derivative of a determinant:\n   $$d \\det(A) = \\text{Tr}\\left( \\text{adj}(A) \\, dA \\right) = \\det(A) \\, \\text{Tr}\\left( A^{-1} dA \\right)$$\n2. Applying the chain rule to the scalar natural logarithm $f(A) = \\ln \\det(A)$:\n   $$df = \\frac{1}{\\det(A)} d \\det(A) = \\frac{1}{\\det(A)} \\left( \\det(A) \\, \\text{Tr}(A^{-1} dA) \\right) = \\text{Tr}\\left( A^{-1} dA \\right)$$\n3. Rewriting the trace using matrix transpose properties:\n   $$\\text{Tr}\\left( A^{-1} dA \\right) = \\text{Tr}\\left( (A^{-T})^T dA \\right)$$\n4. By definition of the matrix gradient $df = \\text{Tr}\\left( (\\nabla_A f)^T dA \\right)$, we directly read off:\n   $$\\nabla_A \\ln \\det(A) = (A^{-1})^T = A^{-T}$$\n5. This fundamental adjoint identity is used throughout normalizing flows, Gaussian processes, and determinantal point processes.",
    },
  ],
};
