provider "aws" {
  region = "us-east-1"
}

terraform {
  backend "s3" {
    bucket = "terraform-state-nc-demo"
    key    = "##PLACEHOLDER##"
    region = "us-east-1"
  }
}

variable branch {}

variable zone_id {
  default = "ZTH40J9BJ47PS"
}

variable root_domain {
  default = "nc-demo.com"
}

variable ssl_arn {
  default = "arn:aws:acm:us-east-1:670848316581:certificate/ff16dd89-bb54-47d7-b8e6-1e9cc607d8c5"
}

variable lambda_role {
  default = "arn:aws:iam::670848316581:role/Lambda-Role"
}

variable neon_server_host {
  default = "ec2-3-227-39-102.compute-1.amazonaws.com"
}

data "archive_file" "lambda_zip" {
    type        = "zip"
    source_file  = "auth.js"
    output_path = "lambda.zip"
}

locals {
  lowBranch = "${lower(var.branch)}"
  safeBranch = "${replace(local.lowBranch, "/[^a-z0-9]+/", "")}"
}

resource "aws_lambda_function" "auth" {
  description = "Basic HTTP authentication module/function"
  role = "${var.lambda_role}"
  runtime = "nodejs10.x"

  function_name = "${local.safeBranch}Auth"
  handler = "auth.handler"

  filename = "lambda.zip" 

  publish = true
}

resource "aws_route53_record" "site" {
  zone_id = "${var.zone_id}"
  name    = "${local.lowBranch}.${var.root_domain}"
  type    = "A"
  alias {
    name                   = "${aws_cloudfront_distribution.site.domain_name}"
    zone_id                = "${aws_cloudfront_distribution.site.hosted_zone_id}"
    evaluate_target_health = false
  }
}

resource "aws_s3_bucket" "site" {
  bucket = "${local.lowBranch}.${var.root_domain}"
  acl    = "private"
  region = "us-east-1"
  force_destroy = true
  tags = {
    environment = "production"
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = "${aws_s3_bucket.site.id}"
  policy = <<EOF
{
  "Version": "2008-10-17",
  "Id": "SiteDomainS3Bucket",
  "Statement": [
    {
      "Sid": "CloudFront Access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "${aws_cloudfront_origin_access_identity.site.iam_arn}"
      },
      "Action": "s3:GetObject",
      "Resource": "${aws_s3_bucket.site.arn}/*"
    }
  ]
}
EOF
}

resource "aws_cloudfront_origin_access_identity" "site" {
  comment = "Site"
}

resource "aws_cloudfront_distribution" "site" {
  origin {
    domain_name = "${aws_s3_bucket.site.bucket_regional_domain_name}"
    origin_id   = "${local.lowBranch}.${var.root_domain}"
    s3_origin_config {
      origin_access_identity = "${aws_cloudfront_origin_access_identity.site.cloudfront_access_identity_path}"
    }
  }

  origin {
    domain_name = "${var.neon_server_host}"
    origin_id   = "${local.lowBranch}.${var.root_domain}-neon"
    custom_origin_config {
      origin_protocol_policy = "http-only"
      origin_ssl_protocols = ["TLSv1.1","SSLv3","TLSv1.2"]
      http_port = 80
      https_port = 443
    }
    custom_header {
      name = "Authorization"
      value = "Basic BASE64_USERNAME_PASSWORD"
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Site"
  default_root_object = "index.html"
  wait_for_deployment = false

  ordered_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    compress            = true
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0

    path_pattern = "/neon/*"

    viewer_protocol_policy = "redirect-to-https"

    target_origin_id = "${local.lowBranch}.${var.root_domain}-neon"
    forwarded_values {
      query_string = true
      headers = ["Origin"]
      cookies {
        forward = "none"
      }
    }
  }

  default_cache_behavior {
    forwarded_values {
      query_string = true
      headers = ["Origin"]
      cookies {
        forward = "none"
      }
    }

    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    compress            = true
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
 
    target_origin_id = "${local.lowBranch}.${var.root_domain}"
    viewer_protocol_policy = "redirect-to-https"

    # Link the Lambda function to CloudFront request
    # for authenticating
    lambda_function_association {
      event_type = "viewer-request"
      lambda_arn = "${aws_lambda_function.auth.qualified_arn}"
    }

    # Link the Lambda function to CloudFront response
    # for setting the authenticated cookie
    lambda_function_association {
      event_type = "viewer-response"
      lambda_arn = "${aws_lambda_function.auth.qualified_arn}"
    }
  }

  custom_error_response {
    error_caching_min_ttl = 300
    error_code = 404
    response_code = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_caching_min_ttl = 300
    error_code = 403
    response_code = 200
    response_page_path = "/index.html"
  }

  price_class = "PriceClass_100"
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  aliases = ["${local.lowBranch}.${var.root_domain}"]
  tags = {
    environment = "production"
  }
  viewer_certificate {
    acm_certificate_arn = "${var.ssl_arn}"
    ssl_support_method = "sni-only"
    minimum_protocol_version = "TLSv1.1_2016"
  }
}
